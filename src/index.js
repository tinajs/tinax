import EventEmitter from 'eventemitter3'
import { helpers } from '@tinajs/tina'

const { mapObject, addHooks } = helpers

function log (...args) {
  if (Wuex.debug) {
    console.log(`[Wuex] -`, ...args)
  }
}

class Wuex {
  static debug = false

  bus = new EventEmitter()

  constructor ({ modules }) {
    let { bus } = this

    this.state = {}
    this.actions = {}
    this.getters = {}

    mapObject(modules, (module, moduleName) => {
      log(`[load module] - ${moduleName}`)

      // state
      this.state[moduleName] = module.state

      // getters
      mapObject(module.getters || {}, (getter, getterName) => {
        this.getters[getterName] = () => getter(this.state[moduleName], this.getters)
      })

      // actions
      mapObject(module.actions || {}, (action, actionName) => {
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
      mapObject(module.mutations || {}, (mutation, mutationName) => {
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
      let handlers = {}

      let combine = function ({ context }) {
        return {
          ...(mapping.state ? mapping.state.call(context, wuex.state) : {}),
          ...(mapping.getters ? mapping.getters.call(context, wuex.getters) : {}),
        }
      }

      if (mapping.actions) {
        properties.methods = { ...properties.methods || {}, ...mapping.actions(this.actions) }
      }

      return addHooks(properties, {
        onLoad (...args) {
          bus.addListener('change', handlers.onChange = () => {
            try {
              this.setData(combine({ context: this }))
            } catch (error) {
              console.error(error)
            }
          })
          this.setData(combine({ context: this }))
        },
        onUnload (...args) {
          if (handlers.onChange) {
            bus.removeListener('change', handlers.onChange)
          }
        },
      })
    }
  }
}

export default Wuex
