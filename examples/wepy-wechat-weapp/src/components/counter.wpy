<style lang="less">
  .counter {
    text-align: left;
    font-size: 12px;
  }
  .count {
    font-size: 18px;
    font-weight: bold;
    &.red {
      color: red;
    }
    &.green {
      color: green;
    }
  }
</style>
<template>
  <view class="counter {{style}}">
    <button @tap="plus" size="mini">  +  </button>
    <button @tap="minus" size="mini">  -  </button>
    <text class="count" :class="{red: num > 55, green: num < 45}"> {{num}} </text>
  </view>
</template>
<script>
  import wepy from 'wepy'

  export default class Counter extends wepy.component {
    props = {
      num: {
        type: [Number, String],
        coerce: function (v) {
          return +v
        },
        default: 50
      }
    }

    data = {
    }
    events = {
      'index-broadcast': (...args) => {
        let $event = args[args.length - 1]
        console.log(`${this.$name} receive ${$event.name} from ${$event.source.$name}`)
      }
    }

    watch = {
      num (curVal, oldVal) {
        console.log(`旧值：${oldVal}，新值：${curVal}`)
      }
    }

    methods = {
      plus () {
        this.num = this.num + 1
        console.log(this.$name + ' plus tap')

        this.$emit('index-emit', 1, 2, 3)
      },
      minus () {
        this.num = this.num - 1
        console.log(this.$name + ' minus tap')
      }
    }
  }
</script>
