import EventEmitter from 'eventemitter3'
import foreach from 'foreach'
import { helpers } from '@tinajs/tina'

const { addHooks } = helpers

function log (...args) {
  if (Tinax.debug) {
    console.log(`[Tinax] -`, ...args)
  }
}

class Tinax {
  static debug = false

  bus = new EventEmitter()

  constructor ({ modules }) {
    let { bus } = this

    this.state = {}
    this.actions = {}
    this.getters = {}

    foreach(modules, (module, moduleName) => {
      log(`[load module] - ${moduleName}`)

      // state
      this.state[moduleName] = module.state

      // getters
      foreach(module.getters || {}, (getter, getterName) => {
        this.getters[getterName] = () => getter(this.state[moduleName], this.getters)
      })

      // actions
      foreach(module.actions || {}, (action, actionName) => {
        this.actions[actionName] = (...args) => {
          return action({
            state: this.state[moduleName],
            rootState: this.state,
            commit: this.commit.bind(this),
            dispatch: this.dispatch.bind(this),
            getters: this.getters,
          }, ...args)
        }
      })

      // mutations
      foreach(module.mutations || {}, (mutation, mutationName) => {
        log(`[load mutation] - ${mutationName} on ${moduleName}`)
        bus.addListener(`mutation:${mutationName}`, (payload) => {
          try {
            this.state[moduleName] = mutation(this.state[moduleName], payload)
            bus.emit('change')
          } catch (error) {
            console.error(error)
          }
        })
      })
    })
  }

  dispatch (actionName, payload) {
    return this.actions[actionName](payload)
  }

  commit (type, data) {
    log(`[commit] - ${type} with ${JSON.stringify(data)}`)
    this.bus.emit(`mutation:${type}`, data)
  }

  connect (mapping) {
    let wuex = this
    return (properties) => {
      let { bus } = this

      let combine = function ({ context }) {
        return {
          ...(mapping.state ? mapping.state.call(context, wuex.state) : {}),
          ...(mapping.getters ? mapping.getters.call(context, wuex.getters) : {}),
        }
      }

      if (mapping.actions) {
        properties.methods = { ...properties.methods || {}, ...mapping.actions(this.actions) }
      }

      function install () {
        this.__tinax_connection__ = this.__tinax_connection__ || new Connection({ bus })
        this.__tinax_connection__.addListener('change', () => {
          try {
            this.setData(combine({ context: this }))
          } catch (error) {
            console.error(error)
          }
        })
        this.setData(combine({ context: this }))
      }

      function uninstall () {
        if (this.__tinax_connection__) {
          this.__tinax_connection__.removeAllListeners()
        }
      }

      return addHooks(properties, {
        onLoad: install,
        onUnload: uninstall,
        attached: install,
        detached: uninstall,
      })
    }
  }
}

class Connection {
  constructor ({ bus }) {
    this.bus = bus
    this.handlers = {}
  }

  addListener (name, handler) {
    this.handlers[name] = this.handlers[name] || []
    this.handlers[name].push(handler)
    this.bus.addListener(name, handler)
    return handler
  }

  removeAllListeners (iteratee) {
    for (let name in this.handlers) {
      let handler
      while (handler = this.handlers[name].pop()) {
        this.bus.removeListener(name, handler)
      }
    }
  }
}

export default Tinax
