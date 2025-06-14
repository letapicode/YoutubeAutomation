use std::{collections::HashMap, path::PathBuf};
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};
use yup_oauth2::storage::{TokenStorage, TokenInfo};
use anyhow::{Context, Result};
use chacha20poly1305::{aead::{Aead, KeyInit, OsRng}, XChaCha20Poly1305, Key, XNonce};
use rand_core::RngCore;

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
        Ok(Self { path, key, tokens: Mutex::new(tokens) })
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
