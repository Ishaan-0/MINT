use crate::config::AgentConfig;
use crate::types::MachineSnapshot;

#[derive(serde::Deserialize)]
pub struct SyncResponse {
    pub machine_id: String,
    pub health_score: Option<i32>,
}

pub async fn post_snapshot(
    snapshot: &MachineSnapshot,
    config: &AgentConfig,
) -> Result<SyncResponse, String> {
    let jwt = config.jwt.as_deref().ok_or("No JWT configured")?;

    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/api/sync", config.api_url))
        .bearer_auth(jwt)
        .json(snapshot)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Sync failed: {body}"));
    }

    res.json::<SyncResponse>().await.map_err(|e| e.to_string())
}
