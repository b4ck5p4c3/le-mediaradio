import { pino } from 'pino';
import { config } from 'dotenv';
import { MediaEvents } from './media-events';
import { getRequiredEnv } from './utils';
import { Display } from './display';
import {DisplayAnimator} from "./display-animator";

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

  const displayAnimator = new DisplayAnimator(display);

  displayAnimator.start();

  me.events.on('stopped', () => {
    displayAnimator.start();
    logger.debug('Stopped');
  });

  me.events.on('metadata', (metadata) => {
    displayAnimator.stop();
    display.setFirstLine(metadata.track.title ?? 'Unknown');
    display.setSecondLine(metadata.track.artist?.join(', ') ?? 'Various artists');
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
