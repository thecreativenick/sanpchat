import { configureStore } from '@reduxjs/toolkit';
import messagesJson from '../../../public/api/messages.json';
import chat, { getMessages, postMessage } from './ChatStore';
import { Message } from './data';

// Fixed "current time" so results never depend on the real clock
const NOW = new Date('2021-06-15T12:00:00Z').getTime();

// Typed as Message[] so the compiler also checks the mock API matches the Message type
const apiMessages: Message[] = messagesJson.messages;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' }
  });

const createStore = () => configureStore({ reducer: { chat } });

describe('ChatStore', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
    // Never hit the network: serve the real mock API file from a fake fetch
    fetchMock = jest.spyOn(window, 'fetch').mockResolvedValue(jsonResponse(messagesJson));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('postMessage()', () => {
    it('stores the time as a millisecond timestamp number', () => {
      const { payload } = postMessage('Julia', 'Hello!');
      expect(typeof payload.time).toBe('number');
      expect(payload.time).toBe(NOW);
    });

    it('stores a time that converts back to the correct date', () => {
      const { payload } = postMessage('Julia', 'Hello!');
      expect(new Date(payload.time).toISOString()).toBe('2021-06-15T12:00:00.000Z');
    });

    it('builds the rest of the message from its arguments', () => {
      const { payload } = postMessage('Julia', 'Hello!');
      expect(payload).toEqual({
        id: expect.stringMatching(UUID_V4),
        author: 'Julia',
        message: 'Hello!',
        time: NOW
      });
    });

    it('gives each message a unique id, even when posted in the same millisecond', () => {
      const first = postMessage('Julia', 'One');
      const second = postMessage('Julia', 'Two');
      expect(first.payload.time).toBe(second.payload.time);
      expect(first.payload.id).not.toBe(second.payload.id);
    });

    it('appends the message to the end of the list', () => {
      const store = createStore();
      store.dispatch(postMessage('Julia', 'First'));
      store.dispatch(postMessage('Lisa', 'Second'));

      const { data } = store.getState().chat.messages;
      expect(data.map(({ message }) => message)).toEqual(['First', 'Second']);
    });
  });

  describe('getMessages()', () => {
    it('requests the thread from the mock API', async () => {
      await createStore().dispatch(getMessages('Lisa'));
      expect(fetchMock).toHaveBeenCalledWith('./api/messages.json?thread=Lisa', {
        method: 'get'
      });
    });

    it('sets loading while the request is in flight', () => {
      const store = createStore();
      store.dispatch(getMessages('Lisa'));
      expect(store.getState().chat.messages.loading).toBe(true);
    });

    it('stores the messages from the API unchanged', async () => {
      const store = createStore();
      await store.dispatch(getMessages('Lisa'));

      const { messages } = store.getState().chat;
      expect(messages.loading).toBe(false);
      expect(messages.error).toBe(false);
      expect(messages.data).toEqual(apiMessages);
    });

    it('sets error when the request fails', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const store = createStore();
      await store.dispatch(getMessages('Lisa'));

      const { messages } = store.getState().chat;
      expect(messages.loading).toBe(false);
      expect(messages.error).toBe(true);
      expect(messages.data).toEqual([]);
    });
  });

  describe('loaded and posted messages share one format', () => {
    const loadThenPost = async () => {
      const store = createStore();
      await store.dispatch(getMessages('Lisa'));
      store.dispatch(postMessage('Julia', 'A new message'));
      return store.getState().chat.messages.data;
    };

    it('uses a millisecond timestamp number for every message', async () => {
      const data = await loadThenPost();
      expect(data).toHaveLength(apiMessages.length + 1);
      data.forEach(({ time }) => {
        expect(typeof time).toBe('number');
        expect(Number.isInteger(time)).toBe(true);
        expect(new Date(time).getTime()).toBe(time);
      });
    });

    it('keeps messages in time order when a new one is posted', async () => {
      const times = (await loadThenPost()).map(({ time }) => time);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    });

    it('gives every message the same fields', async () => {
      const data = await loadThenPost();
      data.forEach((message) => {
        expect(Object.keys(message).sort()).toEqual(['author', 'id', 'message', 'time']);
      });
    });
  });
});
