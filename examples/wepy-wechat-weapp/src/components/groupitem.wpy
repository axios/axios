<style type="less">
.groupitem {
}
</style>
<template>
  <view class="groupitem">
    --<text class="id">{{gitem.childid}}.</text>
    <text class="name" @tap="tap"> {{gitem.childname}}</text>
  </view>
</template>
<script>
  import wepy from 'wepy'

  export default class GroupItem extends wepy.component {
    props = {
      gitem: {}
    }
    data = {
    }
    methods = {
      tap () {
        this.gitem.childname = `Child Random(${Math.random()})`
        console.log(`Clicked Group ${this.$parent.$index}. Item ${this.$index}, ID is ${this.gitem.childid}`)
      }
    }
  }
</script>
