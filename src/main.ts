import * as core from '@actions/core';
import {SSMClient, GetParameterCommand} from '@aws-sdk/client-ssm';

type ActionParams = {
  envVariable: string;
  ssmParameter: string;
};

const getAndValidateArgs = (): ActionParams => {
  core.startGroup('Validating action arguments');

  const ssmParameter = core.getInput('ssm_parameter', {required: true});
  const envVariable = core.getInput('env_variable_name', {required: true});

  const param: ActionParams = {
    envVariable,
    ssmParameter,
  };
  core.debug(`Final actionParam: ${JSON.stringify(param)}`);

  core.info('Validation successful');
  core.endGroup();

  return param;
};

export const main = async (): Promise<void> => {
  try {
    core.info('🚀 Starting AWS SSM Secrets injection (AWS SDK V3)');
    core.info(`Node version: ${process.version}`);

    // Log AWS environment setup for debugging
    core.info(`AWS Region: ${process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'not set'}`);
    core.info(`AWS Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set'}`);
    core.info(`AWS Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set'}`);
    core.info(`AWS Session Token: ${process.env.AWS_SESSION_TOKEN ? 'set' : 'not set'}`);
    core.info(`AWS Config File: ${process.env.AWS_CONFIG_FILE || 'not set'}`);
    core.info(`AWS Shared Credentials File: ${process.env.AWS_SHARED_CREDENTIALS_FILE || 'not set'}`);
    core.info(`AWS Profile: ${process.env.AWS_PROFILE || 'not set'}`);

    const actionParam = getAndValidateArgs();

    core.info('📦 Creating SSM Client with AWS SDK V3');
    const ssmClient = new SSMClient({});
    core.startGroup('Injecting secret environment variables');

    let result;
    try {
      core.info(`🔍 Retrieving parameter: ${actionParam.ssmParameter}`);
      const command = new GetParameterCommand({
        Name: actionParam.ssmParameter,
        WithDecryption: true, // NOTE: this flag is ignored for String and StringList parameter types
      });

      core.info('📡 Sending GetParameter command to AWS SSM');
      result = await ssmClient.send(command);
      core.info('✅ Successfully retrieved parameter from AWS SSM');

    } catch (error) {
      core.error('❌ Failed to retrieve parameter from AWS SSM');
      if (error instanceof Error) {
        core.error(`Error name: ${error.name}`);
        core.error(`Error message: ${error.message}`);
        core.error(`Error stack: ${error.stack}`);
        core.setFailed(`SSM Error: ${error.message}`);
      } else {
        core.error(`Unknown error type: ${typeof error}`);
        core.error(`Error details: ${JSON.stringify(error)}`);
        core.setFailed('Unknown error occurred while retrieving SSM parameter');
      }
      throw error;
    }

    const envVar = actionParam.envVariable.toUpperCase();
    const secret = result?.Parameter?.Value;

    if (!secret) {
      core.warning(`⚠️ Secret value for environment variable ${envVar} appears to be empty`);
    } else {
      core.info(`✅ Retrieved secret value (length: ${secret.length} characters)`);
    }

    core.setSecret(secret || '');
    core.exportVariable(envVar, secret);
    core.info(`🎯 Successfully set secret environment variable: ${envVar}`);

    core.endGroup();
    core.info('🎉 AWS SSM Secrets injection completed successfully');

  } catch (error) {
    core.error('💥 Fatal error in main function');
    if (error instanceof Error) {
      core.error(`Fatal error name: ${error.name}`);
      core.error(`Fatal error message: ${error.message}`);
      core.error(`Fatal error stack: ${error.stack}`);
      core.setFailed(`Fatal error: ${error.message}`);
    } else {
      core.error(`Fatal unknown error type: ${typeof error}`);
      core.error(`Fatal error details: ${JSON.stringify(error)}`);
      core.setFailed('Fatal unknown error occurred');
    }
    throw error;
  }
};
