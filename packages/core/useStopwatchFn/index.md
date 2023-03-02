---
category: Time
---

# useStopwatchFn

Reactive amount of time on interval with controls

## Usage

```html
<script setup lang="ts">
import { useStopwatchFn } from '@vueuse/core'

const { time } = useStopwatchFn()
</script>

<template>
  <div>
    <span>Up time (ms): {{ time }}</span>
  </div>
</template>
```
