<style type="less">
  .group {}
</style>
<template>
  <view class="group">
    <text class="id">{{grouplist.id}}. </text>
    <text class="name" @tap="tap">{{grouplist.name}}</text>
    <view>
      <repeat for="{{grouplist.list}}" item="item">
        <groupitem :gitem="item"></groupitem>
      </repeat>
    </view>
  </view>
</template>
<script>
  import wepy from 'wepy'
  import GroupItem from './groupitem'

  export default class Group extends wepy.component {
    props = {
      grouplist: {},
      index: {}
    }

    components = {
      groupitem: GroupItem
    }
    methods = {
      tap () {
        this.grouplist.name = `Parent Random(${Math.random()})`
        console.log(`Clicked Group ${this.$index}, ID is ${this.grouplist.id}`)
      }
    }
  }
</script>
