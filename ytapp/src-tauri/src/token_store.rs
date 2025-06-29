use anyhow::{Context, Result};
use chacha20poly1305::{
    aead::{Aead, KeyInit, OsRng},
    Key, XChaCha20Poly1305, XNonce,
};
use rand_core::RngCore;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tokio::sync::Mutex;
use yup_oauth2::storage::{TokenInfo, TokenStorage};

#[derive(Serialize, Deserialize, Default)]
struct StoredTokens(HashMap<String, TokenInfo>);

pub struct EncryptedTokenStorage {
    path: PathBuf,
    key: [u8; 32],
    tokens: Mutex<StoredTokens>,
}

impl EncryptedTokenStorage {
    pub async fn new(path: impl Into<PathBuf>, key: [u8; 32]) -> Result<Self> {
        let path = path.into();
        let tokens = match tokio::fs::read(&path).await {
            Ok(data) => {
                if data.len() < 24 {
                    StoredTokens::default()
                } else {
                    let (nonce_bytes, cipher_bytes) = data.split_at(24);
                    let cipher = XChaCha20Poly1305::new(Key::from_slice(&key));
                    let nonce = XNonce::from_slice(nonce_bytes);
                    let decrypted = cipher
                        .decrypt(nonce, cipher_bytes)
                        .context("decrypt token store")?;
                    serde_json::from_slice(&decrypted)?
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => StoredTokens::default(),
            Err(e) => return Err(e.into()),
        };
        Ok(Self {
            path,
            key,
            tokens: Mutex::new(tokens),
        })
    }

    async fn write(&self) -> Result<()> {
        use tokio::io::AsyncWriteExt;
        let tokens = self.tokens.lock().await;
        let data = serde_json::to_vec(&*tokens)?;
        let cipher = XChaCha20Poly1305::new(Key::from_slice(&self.key));
        let mut nonce = [0u8; 24];
        OsRng.fill_bytes(&mut nonce);
        let ciphertext = cipher
            .encrypt(XNonce::from_slice(&nonce), data.as_ref())
            .context("encrypt tokens")?;
        let mut output = nonce.to_vec();
        output.extend(ciphertext);
        let mut file = tokio::fs::File::create(&self.path).await?;
        file.write_all(&output).await?;
        Ok(())
    }

    fn key_for(scopes: &[&str]) -> String {
        let mut scopes: Vec<&str> = scopes.iter().copied().collect();
        scopes.sort_unstable();
        scopes.join(" ")
    }
}

#[async_trait::async_trait]
impl TokenStorage for EncryptedTokenStorage {
    async fn set(&self, scopes: &[&str], token: TokenInfo) -> Result<()> {
        {
            let mut lock = self.tokens.lock().await;
            lock.0.insert(Self::key_for(scopes), token);
        }
        self.write().await
    }

    async fn get(&self, scopes: &[&str]) -> Option<TokenInfo> {
        let lock = self.tokens.lock().await;
        lock.0.get(&Self::key_for(scopes)).cloned()
    }
}

#[cfg(test)]
mod token_store_tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn store_and_retrieve_token() {
        tauri::async_runtime::block_on(async {
            let dir = tempdir().unwrap();
            let path = dir.path().join("tokens.bin");
            let key = [1u8; 32];

            let storage = EncryptedTokenStorage::new(&path, key).await.unwrap();
            let token = TokenInfo {
                access_token: Some("access".into()),
                refresh_token: Some("refresh".into()),
                expires_at: None,
                id_token: None,
            };

            storage.set(&["a", "b"], token.clone()).await.unwrap();

            let retrieved = storage.get(&["b", "a"]).await;
            assert_eq!(retrieved, Some(token));
        });
    }

    #[test]
    fn fails_with_wrong_key() {
        tauri::async_runtime::block_on(async {
            let dir = tempdir().unwrap();
            let path = dir.path().join("tokens.bin");
            let correct_key = [2u8; 32];

            let storage = EncryptedTokenStorage::new(&path, correct_key)
                .await
                .unwrap();
            let token = TokenInfo {
                access_token: Some("t".into()),
                refresh_token: None,
                expires_at: None,
                id_token: None,
            };
            storage.set(&["s"], token).await.unwrap();

            drop(storage);

            let wrong_key = [3u8; 32];
            let result = EncryptedTokenStorage::new(&path, wrong_key).await;
            assert!(result.is_err());
        });
    }
}
