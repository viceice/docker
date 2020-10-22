import is from '@sindresorhus/is';
import chalk from 'chalk';
import got, { HTTPError, Headers } from 'got';
import wwwAuthenticate from 'www-authenticate';
import log from './logger';

export const registry = 'https://index.docker.io';

export type DockerManifestV2 = {
  schemaVersion: number;
  config: {
    digest: string;
  };
};

export async function getAuthHeaders(
  registry: string,
  repository: string
): Promise<Headers> {
  try {
    const apiCheckUrl = `${registry}/v2/`;
    const apiCheckResponse = await got(apiCheckUrl, { throwHttpErrors: false });
    if (apiCheckResponse.headers['www-authenticate'] === undefined) {
      return {};
    }
    const authenticateHeader = new wwwAuthenticate.parsers.WWW_Authenticate(
      apiCheckResponse.headers['www-authenticate']
    );

    const authUrl = `${authenticateHeader.parms.realm}?service=${authenticateHeader.parms.service}&scope=repository:${repository}:pull`;
    const authResponse = (
      await got<{ token?: string; access_token?: string }>(authUrl, {
        responseType: 'json',
      })
    ).body;

    const token = authResponse.token || authResponse.access_token;
    if (!token) {
      throw new Error('Failed to obtain docker registry token');
    }
    return {
      authorization: `Bearer ${token}`,
    };
  } catch (err) {
    log.error(chalk.red('auth error'), (err as Error).message);
    throw new Error('Failed to obtain docker registry token');
  }
}

export enum DockerContentType {
  ManifestV1 = 'application/vnd.docker.distribution.manifest.v1+json',
  ManifestV1Signed = 'application/vnd.docker.distribution.manifest.v1+prettyjws',
  ManifestV2 = 'application/vnd.docker.distribution.manifest.v2+json',
}

export async function getRemoteImageId(
  repository: string,
  tag = 'latest'
): Promise<string> {
  const headers = await getAuthHeaders(registry, repository);
  headers.accept = DockerContentType.ManifestV2;
  const url = `${registry}/v2/${repository}/manifests/${tag}`;

  try {
    const resp = await got<DockerManifestV2>(url, {
      headers,
      responseType: 'json',
    });

    switch (resp.headers['content-type']) {
      case DockerContentType.ManifestV2:
        return resp.body.config.digest;

      case DockerContentType.ManifestV1:
      case DockerContentType.ManifestV1Signed:
        if (is.nonEmptyString(resp.headers['docker-content-digest'])) {
          return resp.headers['docker-content-digest'];
        }
        // something wrong, we need to overwrite existing
        log.warn(
          chalk.yellow('Wrong response'),
          `Wrong response: ${resp.headers['content-type'] as string}`
        );
        return '<none>';

      default:
        throw new Error(
          `Unsupported response: ${resp.headers['content-type'] as string}`
        );
    }
  } catch (e) {
    if (e instanceof HTTPError && e.response.statusCode === 404) {
      // no image published yet
      return '<none>';
    }
    log.error(chalk.red('request error'), (e as Error).message);
    throw new Error('Could not find remote image id');
  }
}
