# Tinax
> A Vuex-like state management library for Tina.js based Wechat-Mini-Program

## Installation
```bash
npm i --save @tinajs/tinax
```

## Guide
### Concepts
Core concepts in Tinax are the same as Vuex:

- State
- Getters
- Mutations
- Actions
- Modules

We recommend you to [learn about these concepts from Vuex's document](https://vuex.vuejs.org/en/core-concepts.html) first.

### Tinax Instance
Each Tinax instance is made up of one or multiple modules.

Creating a new tinax (main store) instance:

```javascript
import Tinax from '@tinajs/tinax'
import users from './modules/users'

export const tinax = new Tinax({
  modules: {
    users,
  },
})
```

### Module
Each Module is made up of **state** *(actually the initial value)*, **getters**, **actions** and **mutations**.

Examples:

```javascript
import { fetchUser } from '../../api'

const TYPES = {
  SET_USER: 'SET_USER',
}

const initialState = {}

const getters = {
  me (state) {
    return state.me
  },
}

const actions = {
  fetchUser ({ commit, state }, { id }) {
    return fetchUser(id)
      .then((user) => commit(TYPES.SET_USER, { id, user }))
  },
}

const mutations = {
  [TYPES.SET_USER] (state, { id, user }) {
    return {
      ...state,
      [id]: user,
    }
  },
}

export default {
  state: initialState,
  getters,
  actions,
  mutations,
}
```

Unlikes Vuex, **the *mutation* in Tinax should be a [pure function](https://en.wikipedia.org/wiki/Pure_function)**, which means you should return the newer state but not alter it directly in the mutation function.

### Using with Page / Component
Tinax is designed to work well with the [Mixin system of Tina](https://tinajs.github.io/tina/#/guide/mixin).

Examples:
```html
<template>
  <view class="user-view">
    <view wx:if="{{ user }}">
      <view class="title">UserId: {{ user.id }}</view>
    </view>
    <view wx:elif="{{ user === false }}">
      <view class="title">User not found.</view>
    </view>
    <view class="title">Current UserId: {{ me.id }}</view>
  </view>
</template>

<script>
import { Page } from '@tinajs/tina'
import { tinax } from '../store'

Page.define({
  mixins: [
    tinax.connect({
      state: function mappingState (state) {
        return {
          user: state.users[this.$route.query.id] || {},
        }
      },
      getters: function mappingGetters (getters) {
        return {
          me: getters.me(),
        }
      },
      actions: function mappingActions (actions) {
        return {
          fetchUser: actions.fetchUser,
        }
      },
    }),
  ],

  onLoad () {
    this.fetchUser({ id: this.$route.query.id })
  },
})
</script>
```

### Application Structure
[Likes Vuex](https://vuex.vuejs.org/en/structure.html), Tinax doesn't restrict your application structure.

However, we still provide you with a suggested example here :wink: :
```
├── app.mina
├── components
│   ├── logo.mina
│   └── ...
├── pages
│   ├── home.mina
│   └── ...
├── services
│   ├── user.js
│   └── ...
└── store
    ├── index.js
    ├── modules
    │   ├── items.js
    │   ├── lists.js
    │   └── users.js
    └── types.js
```

## Full Examples
- [TinaJS - HackerNews Reader](https://github.com/tinajs/tina-hackernews)

## License
MIT &copy; [yelo](https://github.com/imyelo), 2017 - present
