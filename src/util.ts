import browser from "webextension-polyfill"

export const get_default_dict = <T>(get_default: () => T): Record<string | symbol, T> => new Proxy({} as any, {
  get(obj, prop) {
    return prop in obj ? obj[prop] : get_default();
  },
})

const get_storage_accessors = <T>(key_name: string, def: T): [() => Promise<T>, (val: T) => Promise<void>] => {
  let last_queued_op: Promise<any> = Promise.resolve();
  let state_status: ["init" | "uninit", T] = ["uninit", def];
  return [
    async () => {
      last_queued_op = last_queued_op.then(async () => {
        if (state_status[0] === "uninit") {
          const found = (await browser.storage.local.get(key_name))[key_name]
          state_status = [
            "init",
            found !== undefined ?
              (found === "undefined" ? undefined : JSON.parse(found)) :
              state_status[1]
          ]
        }
        return state_status[1]
      })
      return last_queued_op
    },
    async (val: T) => {
      last_queued_op = last_queued_op.then(() => {
        state_status[1] = val
        return browser.storage.local.set({ [key_name]: JSON.stringify(val) })
      })
    }
  ]
}

export {
  get_storage_accessors,
}
