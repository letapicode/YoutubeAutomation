use std::collections::HashMap;
use std::path::PathBuf;
use tokio::sync::RwLock;

use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use async_trait::async_trait;
use rand::RngCore;
use yup_oauth2::storage::{TokenInfo, TokenStorage};

pub struct EncryptedTokenStorage {
    file: PathBuf,
    key: [u8; 32],
    tokens: RwLock<HashMap<String, TokenInfo>>,
}

impl EncryptedTokenStorage {
    pub async fn new(file: PathBuf, key: [u8; 32]) -> Self {
        let mut storage = EncryptedTokenStorage {
            file,
            key,
            tokens: RwLock::new(HashMap::new()),
        };
        storage.load().await.ok();
        storage
    }

    fn cipher(&self) -> Aes256Gcm {
        Aes256Gcm::new_from_slice(&self.key).unwrap()
    }

    fn scopes_key(scopes: &[&str]) -> String {
        let mut scopes_vec: Vec<&str> = scopes.iter().copied().collect();
        scopes_vec.sort_unstable();
        scopes_vec.join(" ")
    }

    async fn load(&mut self) -> anyhow::Result<()> {
        if let Ok(data) = tokio::fs::read(&self.file).await {
            if data.len() > 12 {
                let nonce = &data[..12];
                let cipher = self.cipher();
                if let Ok(plain) = cipher.decrypt(Nonce::from_slice(nonce), &data[12..]) {
                    if let Ok(map) = serde_json::from_slice::<HashMap<String, TokenInfo>>(&plain) {
                        *self.tokens.write().await = map;
                    }
                }
            }
        }
        Ok(())
    }

    async fn save(&self) -> anyhow::Result<()> {
        use tokio::io::AsyncWriteExt;
        let map = self.tokens.read().await;
        let json = serde_json::to_vec(&*map)?;
        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        let cipher = self.cipher();
        let ciphertext = cipher.encrypt(Nonce::from_slice(&nonce), json.as_ref())?;
        let mut out = nonce.to_vec();
        out.extend_from_slice(&ciphertext);
        let mut file = open_writeable_file(&self.file).await?;
        file.write_all(&out).await?;
        Ok(())
    }
}

#[async_trait]
impl TokenStorage for EncryptedTokenStorage {
    async fn set(&self, scopes: &[&str], token: TokenInfo) -> anyhow::Result<()> {
        let key = Self::scopes_key(scopes);
        self.tokens.write().await.insert(key, token);
        self.save().await?;
        Ok(())
    }

    async fn get(&self, scopes: &[&str]) -> Option<TokenInfo> {
        let key = Self::scopes_key(scopes);
        self.tokens.read().await.get(&key).cloned()
    }
}

#[cfg(unix)]
async fn open_writeable_file(
    filename: impl AsRef<std::path::Path>,
) -> Result<tokio::fs::File, tokio::io::Error> {
    use std::os::unix::fs::OpenOptionsExt;
    let opts: tokio::fs::OpenOptions = {
        let mut opts = std::fs::OpenOptions::new();
        opts.write(true).create(true).truncate(true).mode(0o600);
        opts.into()
    };
    opts.open(filename).await
}

#[cfg(not(unix))]
async fn open_writeable_file(
    filename: impl AsRef<std::path::Path>,
) -> Result<tokio::fs::File, tokio::io::Error> {
    tokio::fs::File::create(filename).await
}
