---
category: Time
---

# useTimer

Reactive timer

## Usage

```html
<script setup lang="ts">
import { useTimer } from '@vueuse/core'

const { timespan } = useTimer()
</script>

<template>
  <div>
    <span>Time (ms): {{ timespan }}</span>
  </div>
</template>
```
