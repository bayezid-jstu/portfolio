// localStorage / sessionStorage can throw (private browsing, blocked cookies,
// full storage). These wrappers never throw.

function make(kind) {
  const get = () => {
    try { return window[kind]; } catch { return null; }
  };
  return {
    read(key) {
      try { return get()?.getItem(key) ?? null; } catch { return null; }
    },
    write(key, value) {
      try { get()?.setItem(key, value); return true; } catch { return false; }
    },
  };
}

export const local = make('localStorage');
export const session = make('sessionStorage');
