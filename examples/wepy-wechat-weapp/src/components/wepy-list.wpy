<style lang="less">
    .mylist:odd {
        color: red;
    }
    .mylist:even {
        color: green;
    }
</style>
<template>
    <view class="wepy-list">
        <view>
            <button @tap="add" size="mini">添加列表another</button>
        </view>
        <block wx:for-items="{{list}}" wx:for-index="index" wx:for-item="item" wx:key="id">
            <view @tap="tap" class="mylist">
                <text>{{item.id}}</text>: {{item.title}}
            </view>
        </block>
    </view>
</template>
<script>
  import wepy from 'wepy'

  export default class ListAnother extends wepy.component {
    data = {
      list: [
        {
          id: '0',
          title: 'loading'
        }
      ]
    }

    events = {
      'index-broadcast': (...args) => {
        let $event = args[args.length - 1]
        console.log(`${this.$name} receive ${$event.name} from ${$event.source.name}`)
      }
    }

    methods = {
      tap () {
        // this.num = this.num + 1
        console.log(this.$name + ' tap')
      },
      add () {
        let len = this.list.length
        this.list.push({id: len + 1, title: 'title_' + len})
      }
    }

    onLoad () {
    }
  }
</script>
