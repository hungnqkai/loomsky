<template>
  <v-navigation-drawer
    app
    class="loomsky-sidebar fixed-sidebar"
    :rail="rail"
    :expand-on-hover="rail"
    permanent
  >
    <!-- Phần Logo & Tên User -->
    <v-list>
      <v-list-item
        prepend-avatar="https://placehold.co/40x40/6366f1/ffffff?text=L"
        title="LoomSky"
        class="font-weight-bold primary"
      ></v-list-item>

    </v-list>

    <v-divider></v-divider>

    <!-- Các mục điều hướng đã được tinh gọn -->
    <v-list nav density="compact">
      <v-list-item
        title="Dashboard"
        value="dashboard"
        to="/dashboard"
        class="primary"
        exact
      >
      <template #prepend>
        <!-- SVG Dashboard -->
        <svg class="sidebar-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="18" height="18" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" d="M14.5 6.5h3m0 0h3m-3 0v3m0-3v-3"></path><path d="M2.5 6.5c0-1.886 0-2.828.586-3.414S4.614 2.5 6.5 2.5s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586S2.5 8.386 2.5 6.5Zm11 11c0-1.886 0-2.828.586-3.414s1.528-.586 3.414-.586s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586s-.586-1.528-.586-3.414Z"></path><path d="M2.5 17.5c0-1.886 0-2.828.586-3.414S4.614 13.5 6.5 13.5s2.828 0 3.414.586s.586 1.528.586 3.414s0 2.828-.586 3.414s-1.528.586-3.414.586s-2.828 0-3.414-.586S2.5 19.386 2.5 17.5Z" opacity=".5"></path></g>
        </svg>
      </template>
      </v-list-item>
      
      <!-- CÁC MỤC CHỨC NĂNG CHÍNH SẼ Ở ĐÂY -->
      

      <!-- === THÊM NHÓM MENU MỚI === -->
      <v-list-item
        title="Tracking"
        value="tracking"
        to="/tracking/websites"
        class="primary"
      >
      <template #prepend>
        <!-- SVG Dashboard -->
        <svg class="sidebar-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="18" height="18" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" d="M22 22H2"></path><path d="M21 22v-7.5a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5V22" opacity=".5"></path><path d="M15 22V5c0-1.414 0-2.121-.44-2.56C14.122 2 13.415 2 12 2s-2.121 0-2.56.44C9 2.878 9 3.585 9 5v17"></path><path d="M9 22V9.5A1.5 1.5 0 0 0 7.5 8h-3A1.5 1.5 0 0 0 3 9.5V22" opacity=".5"></path></g>
        </svg>
      </template>  
      </v-list-item>
      <!-- === KẾT THÚC THÊM MỚI === -->
      <v-list-item
        title="Cài đặt"
        value="settings"
        to="/dashboard/settings"
        class="primary"
      >
      <template #prepend>
        <!-- SVG Dashboard -->
        <svg class="sidebar-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" width="18" height="18" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"></circle>
          <path d="M13.765 2.152C13.398 2 12.932 2 12 2s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.62 1.62 0 0 1-.79 1.353a1.62 1.62 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7s-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555c.473.297.777.803.777 1.361s-.304 1.064-.777 1.36c-.321.203-.529.364-.676.556a2 2 0 0 0-.396 1.479c.052.394.285.798.75 1.605c.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.62 1.62 0 0 1 1.567.008c.483.28.77.795.79 1.353c.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863c.02-.558.307-1.074.79-1.353a1.62 1.62 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453s.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.62 1.62 0 0 1 19.562 12c0-.558.304-1.064.777-1.36c.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605c-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.62 1.62 0 0 1-1.566-.008a1.62 1.62 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0-1.083-1.083Z" opacity=".5"></path></g>
        </svg>
      </template>  
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>

defineProps({
  rail: {
    type: Boolean,
    default: true,
  }
});
</script>

<style scoped lang="scss">
// Fix sidebar positioning
.fixed-sidebar {
  position: fixed !important;
  z-index: 1004 !important;
  height: 100vh !important;
}

// Ensure sidebar content is scrollable if needed
:deep(.v-navigation-drawer__content) {
  height: 100%;
  overflow-y: auto;
}

.sidebar-icon {
  width: 18px;
  height: 18px;
  margin-right: 25px; // Thường 16px là đẹp, bạn có thể chỉnh lại
  display: inline-block;
  vertical-align: middle;
}

.v-list-item--active {
  background: #e5f1f8;
  color: #0074ba;
}

:deep(.v-list-item__prepend) {
  display: flex;
  align-items: center;     // Dọc (vertical)
  justify-content: center; // Ngang (horizontal, nếu cần)
  min-width: 40px;         // Cố định rộng như mặc định (rộng cho icon nhỏ khỏi bị lệch)
}

</style>
