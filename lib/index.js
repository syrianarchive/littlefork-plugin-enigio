import {get, curry, merge} from 'lodash/fp';
import fetch from 'node-fetch';
import fs from 'fs';
import {envelope as env} from '@sugarcube/core';

const send = curry((u, p, e, dl) => {
  const fileName = get('location', dl);

  if (!fileName) { return dl; }

  console.time('fsstat');
  const {size} = fs.statSync(fileName);
  console.timeEnd('fsstat');

  const mime = 'text/plain';
  const sha256 = get('sha256', dl);
  const c = `${get('term', dl)}`;
  const userId = e;

  const url = `https://${u}:${p}@api.timebeat.com/s/timeStamp/reg?size=${size}&mime=${mime}&fileName=${fileName}&sha256=${sha256}&c=${c}&userId=${userId}`;
  console.log(url);
  console.time('send');
  return fetch(url)
    .then(r => {
      console.timeEnd('send');
      if (!r.ok) {
        console.log(r);
        throw new Error('Enigio Login Failed or resource wrong');
      }
      return r.json();
    })
    .catch((err) => {
      console.error('FAILED');
      console.log(err);
      return {v: 'failed'};
    })
    .then((t) => {
      const timestamp = get('v', t);
      console.log(t);
      return merge({timestamp}, dl);
    });
});

const enigio = (envelope, {log, cfg}) => {
  const u = get('enigio.name', cfg);
  const p = get('enigio.password', cfg);
  const e = get('enigio.email', cfg);

  const s = send(u, p, e);

  log.debug('running enigio plugin');

  return env.fmapDataDownloadsAsync(s, envelope);
};

enigio.desc = 'Timestamp and store hash with enigio';

enigio.argv = {
  'enigio.name': {
    type: 'text',
    nargs: 1,
    desc: 'Enigio Username',
  },
  'enigio.password': {
    type: 'text',
    nargs: 1,
    desc: 'Enigio Password',
  },
  'enigio.email': {
    type: 'text',
    nargs: 1,
    desc: 'Enigio Email',
  },
};
const plugins = {
  enigio_timestamp: enigio,
};

export { plugins };
export default { plugins };
