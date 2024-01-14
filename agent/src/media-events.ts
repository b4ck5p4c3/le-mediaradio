import type { Variant } from 'dbus-next';
import { systemBus } from 'dbus-next';
import mitt from 'mitt';

const MPRIS_PATH = '/org/mpris/MediaPlayer2';
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties';
const SHAIRPORT_MPRIS_NAME = 'org.mpris.MediaPlayer2.ShairportSync';

type MediaSource = 'airplay' | 'bluetooth';

enum PlaybackEventAction {
  Playing = 'Playing',
  Paused = 'Paused',
  Stopped = 'Stopped',
}

/**
 * TODO: introduce normal typings
 */

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ¯\_(ツ)_/¯
type MEEvents = {
  playback: MEPlayback;
  playing: MEPrimitive;
  paused: MEPrimitive;
  stopped: MEPrimitive;
  metadata: MEMetadata;
};

interface MEPrimitive {
  source: MediaSource;
}

interface MEPlayback extends MEPrimitive {
  type: PlaybackEventAction;
}

interface MEMetadata {
  source: MediaSource;
  track: {
    title?: string;
    album?: string;
    artist?: string[];
    genre?: string[];
    coverArt?: string;
  };
}

interface PlaybackStatusEvent {
  PlaybackStatus: Variant<string>;
}

interface MPRISMetadata {
  'mpris:trackid'?: Variant<string>;
  'mpris:length'?: Variant<number>;
  'mpris:artUrl'?: Variant<string>;
  'xesam:album'?: Variant<string>;
  'xesam:albumArtist'?: Variant<string[]>;
  'xesam:artist'?: Variant<string[]>;
  'xesam:asText'?: Variant<string>;
  'xesam:audioBPM'?: Variant<number>;
  'xesam:autoRating'?: Variant<number>;
  'xesam:comment'?: Variant<string[]>;
  'xesam:composer'?: Variant<string[]>;
  'xesam:contentCreated'?: Variant<string>; // ISO 8601 Date
  'xesam:discNumber'?: Variant<number>;
  'xesam:firstUsed'?: Variant<string>; // ISO 8601 Date
  'xesam:genre'?: Variant<string[]>;
  'xesam:lastUsed'?: Variant<string>; // ISO 8601 Date
  'xesam:lyricist'?: Variant<string[]>;
  'xesam:title'?: Variant<string>;
  'xesam:trackNumber'?: Variant<number>;
  'xesam:url'?: Variant<string>;
  'xesam:useCount'?: Variant<number>;
  'xesam:userRating'?: Variant<number>;
}

interface MetadataEvent {
  Metadata: Variant<MPRISMetadata>;
}

type ShairportEvent = PlaybackStatusEvent | MetadataEvent;

interface BluezMetadata {
  Duration?: Variant<number>;
  Genre?: Variant<string>;
  Title?: Variant<string>;
  TrackNumber?: Variant<number>;
  Artist?: Variant<string>;
  NumberOfTracks?: Variant<number>;
  Album?: Variant<string>;
}

interface BluezMetadataEvent {
  Track: Variant<BluezMetadata>;
}

enum BluezPlaybackStatus {
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
}

interface BluezStatusEvent {
  Status: Variant<BluezPlaybackStatus>;
}

type BluezEvent = BluezMetadataEvent | BluezStatusEvent;

class MediaEvents {
  private bus = systemBus();
  public events = mitt<MEEvents>();

  async init(): Promise<void> {
    await Promise.all([this.initBluez(), this.initShairport()]);
  }

  private async initShairport(): Promise<void> {
    const obj = await this.bus.getProxyObject(SHAIRPORT_MPRIS_NAME, MPRIS_PATH);
    const props = obj.getInterface(PROPERTIES_IFACE);

    props.on('PropertiesChanged', (iface: string, payload: ShairportEvent) => {
      if ('PlaybackStatus' in payload) {
        const action =
          PlaybackEventAction[
            payload.PlaybackStatus.value as PlaybackEventAction
          ];

        this.events.emit('playback', {
          source: 'airplay',
          type: action,
        });

        switch (action) {
          case PlaybackEventAction.Paused:
            this.events.emit('paused', { source: 'airplay' });
            break;
          case PlaybackEventAction.Playing:
            this.events.emit('playing', { source: 'airplay' });
            break;
          case PlaybackEventAction.Stopped:
            this.events.emit('stopped', { source: 'airplay' });
            break;
        }

        return;
      }

      if ('Metadata' in payload) {
        const track: MEMetadata['track'] = {
          album: payload.Metadata.value['xesam:album']?.value,
          artist: payload.Metadata.value['xesam:artist']?.value,
          coverArt: payload.Metadata.value['mpris:artUrl']?.value,
          genre: payload.Metadata.value['xesam:genre']?.value,
          title: payload.Metadata.value['xesam:title']?.value,
        };

        this.events.emit('metadata', {
          source: 'airplay',
          track,
        });
      }
    });
  }

  private async initBluez(): Promise<void> {
    const bluez = await this.bus.getProxyObject('org.bluez', '/');
    const objectManager = bluez.getInterface(
      'org.freedesktop.DBus.ObjectManager',
    );

    objectManager.on(
      'InterfacesAdded',
      (path: string, iface: Record<string, unknown>) => {
        if ('org.bluez.MediaPlayer1' in iface) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises -- ¯\_(ツ)_/¯
          this.handleBluezDevice(path);
        }
      },
    );

    // todo: handle iface destroy to release resources
  }

  private async handleBluezDevice(path: string): Promise<void> {
    const obj = await this.bus.getProxyObject('org.bluez', path);
    const props = obj.getInterface(PROPERTIES_IFACE);

    props.on('PropertiesChanged', (iface: string, payload: BluezEvent) => {
      if ('Track' in payload) {
        const artist = payload.Track.value.Artist?.value
          ? [payload.Track.value.Artist.value]
          : undefined;

        const genre = payload.Track.value.Genre?.value
          ? [payload.Track.value.Genre.value]
          : undefined;

        const track: MEMetadata['track'] = {
          album: payload.Track.value.Album?.value,
          artist,
          genre,
          title: payload.Track.value.Title?.value,
        };

        this.events.emit('metadata', {
          source: 'bluetooth',
          track,
        });

        return;
      }

      if ('Status' in payload) {
        switch (payload.Status.value) {
          case BluezPlaybackStatus.Paused:
            this.events.emit('paused', { source: 'bluetooth' });
            this.events.emit('playback', {
              source: 'bluetooth',
              type: PlaybackEventAction.Paused,
            });
            break;
          case BluezPlaybackStatus.Playing:
            this.events.emit('playing', { source: 'bluetooth' });
            this.events.emit('playback', {
              source: 'bluetooth',
              type: PlaybackEventAction.Playing,
            });
            break;
          case BluezPlaybackStatus.Stopped:
            this.events.emit('stopped', { source: 'bluetooth' });
            this.events.emit('playback', {
              source: 'bluetooth',
              type: PlaybackEventAction.Stopped,
            });
            break;
        }
      }
    });
  }
}

export { MediaEvents };
