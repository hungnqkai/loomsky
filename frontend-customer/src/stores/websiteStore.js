/*
File: src/stores/websiteStore.js (CẬP NHẬT)
- Bổ sung đầy đủ các action cho việc CRUD Event Filters và Blacklist.
*/
import { defineStore } from 'pinia';
import { ref } from 'vue';
import websiteService from '../services/websiteService';

export const useWebsiteStore = defineStore('website', () => {
  // --- STATE ---
  const websites = ref([]);
  const currentWebsite = ref(null);
  const pixels = ref([]);
  const eventFilters = ref([]);
  const blacklist = ref([]);
  const loading = ref(false);
  const actionLoading = ref(false); // Loading riêng cho các hành động nhỏ
  const error = ref(null);
  const successMessage = ref(null);

  // --- ACTIONS ---
  function clearMessages() {
    error.value = null;
    successMessage.value = null;
  }

  // === Website Actions ===
  async function fetchWebsites() {
    loading.value = true;
    clearMessages();
    try {
      const response = await websiteService.getWebsites();
      websites.value = response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Không thể tải danh sách website.';
    } finally {
      loading.value = false;
    }
  }

  async function createWebsite(data) {
    loading.value = true;
    clearMessages();
    try {
      const response = await websiteService.createWebsite(data);
      websites.value.unshift(response.data.data);
      successMessage.value = 'Tạo website thành công!';
      return response.data.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Tạo website thất bại.';
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchWebsiteById(websiteId) {
    loading.value = true;
    currentWebsite.value = null;
    clearMessages();
    try {
      const response = await websiteService.getWebsiteById(websiteId);
      currentWebsite.value = response.data.data;
      // Tải song song các dữ liệu con
      await Promise.all([
        fetchPixels(websiteId),
        fetchEventFilters(websiteId),
        fetchBlacklist(websiteId)
      ]);
    } catch (err) {
      error.value = err.response?.data?.error || 'Không tìm thấy website.';
    } finally {
      loading.value = false;
    }
  }

  async function deleteWebsite(websiteId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteWebsite(websiteId);
        const index = websites.value.findIndex(w => w.id === websiteId);
        if (index > -1) websites.value.splice(index, 1);
        successMessage.value = 'Xóa website thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa website thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Pixel Actions ===
  async function fetchPixels(websiteId) {
      try {
          const response = await websiteService.getPixels(websiteId);
          pixels.value = response.data.data;
      } catch (err) {
          error.value = err.response?.data?.error || 'Không thể tải danh sách pixel.';
      }
  }

  async function addPixel(websiteId, data) {
      actionLoading.value = true;
      clearMessages();
      try {
          const response = await websiteService.addPixel(websiteId, data);
          pixels.value.push(response.data.data);
          successMessage.value = 'Thêm Pixel thành công!';
          return true;
      } catch (err) {
          error.value = err.response?.data?.error || 'Thêm Pixel thất bại.';
          return false;
      } finally {
          actionLoading.value = false;
      }
  }

  async function updatePixel(websiteId, pixelId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.updatePixel(websiteId, pixelId, data);
        const index = pixels.value.findIndex(p => p.id === pixelId);
        if (index > -1) pixels.value[index] = response.data.data;
        successMessage.value = 'Cập nhật Pixel thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Cập nhật Pixel thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deletePixel(websiteId, pixelId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deletePixel(websiteId, pixelId);
        const index = pixels.value.findIndex(p => p.id === pixelId);
        if (index > -1) pixels.value.splice(index, 1);
        successMessage.value = 'Xóa Pixel thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa Pixel thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Event Filter Actions ===
  async function fetchEventFilters(websiteId) {
    try {
        const response = await websiteService.getEventFilters(websiteId);
        eventFilters.value = response.data.data;
    } catch (err) {
        error.value = err.response?.data?.error || 'Không thể tải bộ lọc sự kiện.';
    }
  }

  async function addEventFilter(websiteId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.addEventFilter(websiteId, data);
        eventFilters.value.push(response.data.data);
        successMessage.value = 'Thêm bộ lọc thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Thêm bộ lọc thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deleteEventFilter(websiteId, filterId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteEventFilter(websiteId, filterId);
        const index = eventFilters.value.findIndex(f => f.id === filterId);
        if (index > -1) eventFilters.value.splice(index, 1);
        successMessage.value = 'Xóa bộ lọc thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa bộ lọc thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  // === Blacklist Actions ===
  async function fetchBlacklist(websiteId) {
    try {
        const response = await websiteService.getBlacklist(websiteId);
        blacklist.value = response.data.data;
    } catch (err) {
        error.value = err.response?.data?.error || 'Không thể tải danh sách chặn.';
    }
  }

  async function addBlacklistEntry(websiteId, data) {
    actionLoading.value = true;
    clearMessages();
    try {
        const response = await websiteService.addBlacklistEntry(websiteId, data);
        blacklist.value.unshift(response.data.data);
        successMessage.value = 'Thêm vào danh sách chặn thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Thêm vào danh sách chặn thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  async function deleteBlacklistEntry(websiteId, blacklistId) {
    actionLoading.value = true;
    clearMessages();
    try {
        await websiteService.deleteBlacklistEntry(websiteId, blacklistId);
        const index = blacklist.value.findIndex(b => b.id === blacklistId);
        if (index > -1) blacklist.value.splice(index, 1);
        successMessage.value = 'Xóa khỏi danh sách chặn thành công!';
        return true;
    } catch (err) {
        error.value = err.response?.data?.error || 'Xóa khỏi danh sách chặn thất bại.';
        return false;
    } finally {
        actionLoading.value = false;
    }
  }

  return {
    websites, currentWebsite, pixels, eventFilters, blacklist,
    loading, actionLoading, error, successMessage,
    clearMessages, fetchWebsites, createWebsite, fetchWebsiteById, deleteWebsite,
    fetchPixels, addPixel, updatePixel, deletePixel,
    fetchEventFilters, addEventFilter, deleteEventFilter,
    fetchBlacklist, addBlacklistEntry, deleteBlacklistEntry,
  };
});