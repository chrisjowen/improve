import { mount, unmount } from "svelte";
import App from "./App.svelte";

/**
 * Mount improve's review UI in `target` (an element's shadow root), with the
 * provider's value and Wheelhouse's host API as props that the element can
 * change later. They are held raw, not as deep state: the value is replaced
 * whole each time, and the host is a frozen object of Wheelhouse's.
 * @param {ShadowRoot} target
 * @param {{ data: unknown, host: unknown }} initial
 */
export function mountApp(target, initial) {
  let data = $state.raw(initial.data);
  let host = $state.raw(initial.host);
  const app = mount(App, {
    target,
    props: {
      get data() {
        return data;
      },
      get host() {
        return host;
      }
    }
  });
  return {
    /** @param {unknown} v */
    setData(v) {
      data = v;
    },
    /** @param {unknown} v */
    setHost(v) {
      host = v;
    },
    destroy() {
      unmount(app);
    }
  };
}
