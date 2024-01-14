import { pino } from 'pino';
import { config } from 'dotenv';
import { MediaEvents } from './media-events';
import { getRequiredEnv } from './utils';
import { Display } from './display';

config();
const logger = pino({
  name: 'main',
  level: process.env.MR_VERBOSITY ?? 'info',
});

const me = new MediaEvents();
const displayInterface = getRequiredEnv('MR_DISPLAY');

async function main(): Promise<void> {
  const display = new Display(displayInterface);
  await me.init();
  display.run();

  display.setAuthor('Standby');
  display.setTitle('AirPlay & Bluetooth');

  me.events.on('stopped', () => {
    display.setAuthor('Standby');
    display.setTitle('AirPlay & Bluetooth');
    logger.debug('Stopped');
  });

  me.events.on('metadata', (metadata) => {
    display.setAuthor(metadata.track.artist?.join(', ') ?? 'Various artists');
    display.setTitle(metadata.track.title ?? 'Unknown');
    logger.debug('Metadata updated');
  });
}

main()
  .then(() => {
    logger.info('started up');
  })
  .catch((err) => {
    logger.error(err);
  });
