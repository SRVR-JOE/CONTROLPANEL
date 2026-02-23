import type { SystemEvent, NotificationChannel } from '@/types';
import * as email from './email';
import * as sms from './sms';
import * as slack from './slack';
import * as discord from './discord';
import * as inApp from './in-app';

type ChannelSender = {
  send: (event: SystemEvent, config: Record<string, unknown>) => Promise<void>;
};

const channelRegistry: Record<NotificationChannel, ChannelSender> = {
  email,
  sms,
  slack,
  discord,
  in_app: inApp,
};

export function getChannelSender(channel: NotificationChannel): ChannelSender {
  return channelRegistry[channel];
}

export { inApp };
