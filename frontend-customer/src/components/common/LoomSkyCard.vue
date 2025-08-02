<template>
  <!-- 
    Component này sẽ "bọc" v-card của Vuetify.
    - Nó áp dụng một class tùy chỉnh `loomsky-card` để định nghĩa style chuẩn.
    - `v-bind="$attrs"` là một kỹ thuật quan trọng để "truyền" tất cả các props
      (như title, min-width, loading...) từ LoomSkyCard xuống v-card bên trong,
      giúp component của chúng ta linh hoạt như v-card gốc.
  -->
  <v-card class="loomsky-card" v-bind="$attrs">
    <!-- 
      <slot> cho phép chúng ta đặt bất kỳ nội dung nào vào bên trong card,
      giống hệt như cách chúng ta dùng v-card.
    -->
    <slot></slot>
  </v-card>
</template>

<script setup>
// Component này chủ yếu là về template và style, không cần logic phức tạp.
// defineOptions giúp chúng ta tắt việc component này tự động kế thừa các attribute
// không mong muốn, đảm bảo chỉ các props được truyền xuống v-card.
defineOptions({
  inheritAttrs: false,
});
</script>

<style scoped lang="scss">
.loomsky-card {
  // Ghi đè style mặc định của Vuetify
  border: 1px solid var(--loomsky-neutral-100) !important;
  box-shadow: 0px 10px 20px -5px rgba(0, 0, 0, 0.08) !important;
  border-radius: var(--border-radius-xl) !important; // 12px
}
</style>
