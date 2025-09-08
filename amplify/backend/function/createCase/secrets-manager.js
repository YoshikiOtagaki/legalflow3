// LegalFlow3 - Secrets Manager
// AWS Secrets Manager integration for Lambda functions

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

let cachedSecrets = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get secrets from AWS Secrets Manager
 * @param {string} secretName - Name of the secret
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<Object>} Secret values
 */
async function getSecrets(secretName, forceRefresh = false) {
  const now = Date.now();

  // Return cached secrets if still valid and not forcing refresh
  if (!forceRefresh && cachedSecrets && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: secretName
    });

    const response = await secretsClient.send(command);
    const secretString = response.SecretString;

    if (!secretString) {
      throw new Error('Secret string is empty');
    }

    cachedSecrets = JSON.parse(secretString);
    lastFetchTime = now;

    return cachedSecrets;
  } catch (error) {
    console.error('Error fetching secrets:', error);
    throw new Error(`Failed to fetch secrets: ${error.message}`);
  }
}

/**
 * Get a specific secret value
 * @param {string} secretName - Name of the secret
 * @param {string} key - Key within the secret
 * @param {boolean} forceRefresh - Force refresh the cache
 * @returns {Promise<string>} Secret value
 */
async function getSecretValue(secretName, key, forceRefresh = false) {
  const secrets = await getSecrets(secretName, forceRefresh);

  if (!secrets || !secrets[key]) {
    throw new Error(`Secret key '${key}' not found in secret '${secretName}'`);
  }

  return secrets[key];
}

/**
 * Clear the secrets cache
 */
function clearSecretsCache() {
  cachedSecrets = null;
  lastFetchTime = 0;
}

module.exports = {
  getSecrets,
  getSecretValue,
  clearSecretsCache
};
