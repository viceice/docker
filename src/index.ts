import got from 'got';
import { DockerContentType, getAuthHeaders, registry } from './utils/docker';
import log from './utils/logger';

const repository = 'amd64/ubuntu';
const tag = 'latest';

async function run(): Promise<void> {
  const headers = await getAuthHeaders(registry, repository);

  headers.accept = DockerContentType.ManifestV1;
  const url = `${registry}/v2/${repository}/manifests/${tag}`;

  const resp = await got<Record<string, any>>(url, {
    headers,
    responseType: 'json',
  });

  log.dir(resp.headers);
  log.dir(resp.body);

  // headers.accept = DockerContentType.ManifestV2;

  // resp = await got(url, {
  //   headers,
  //   responseType: 'json',
  // });

  // log.dir(resp.headers);
  // log.dir(resp.body.config)
}

run().catch(log.error);
