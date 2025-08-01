<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h4">Quản lý đội nhóm</h1>
      <v-btn color="primary" @click="openInviteDialog">
        <v-icon left>mdi-account-plus-outline</v-icon>
        Mời thành viên
      </v-btn>
    </div>

    <v-alert
      v-if="teamStore.error"
      type="error"
      variant="tonal"
      class="mb-4"
      density="compact"
      closable
      @click:close="teamStore.clearMessages()"
    >
      {{ teamStore.error }}
    </v-alert>
    <v-alert
      v-if="teamStore.successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      density="compact"
      closable
      @click:close="teamStore.clearMessages()"
    >
      {{ teamStore.successMessage }}
    </v-alert>

    <v-card>
      <v-card-title>Danh sách thành viên</v-card-title>
      <v-data-table
        :headers="headers"
        :items="teamStore.members"
        :loading="teamStore.loading"
        item-value="id"
        class="elevation-1"
      >
        <template v-slot:item.role="{ item }">
          <v-chip :color="getRoleColor(item.role)" small>{{ item.role }}</v-chip>
        </template>

        <template v-slot:item.last_login_at="{ item }">
          {{ formatDateTime(item.last_login_at) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon
            small
            @click="openDeleteDialog(item)"
            color="error"
            :disabled="item.id === authStore.user.id"
            >mdi-delete-outline</v-icon
          >
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="inviteDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">Mời thành viên mới</span>
        </v-card-title>
        <v-card-text>
          <v-alert v-if="inviteError" type="error" density="compact" class="mb-4">{{ inviteError }}</v-alert>
          <v-form ref="inviteForm">
            <v-text-field
              v-model="invitation.email"
              label="Email"
              :rules="[rules.required, rules.email]"
              variant="outlined"
            ></v-text-field>
            <v-select
              v-model="invitation.role"
              :items="['admin', 'member', 'viewer']"
              label="Vai trò"
              :rules="[rules.required]"
              variant="outlined"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="closeInviteDialog">Hủy</v-btn>
          <v-btn color="primary" @click="handleInvite" :loading="teamStore.loading">Gửi lời mời</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500px">
        <v-card>
            <v-card-title class="text-h5">Xác nhận xóa</v-card-title>
            <v-card-text>
                Bạn có chắc chắn muốn xóa thành viên
                <strong>{{ memberToDelete?.email }}</strong>
                khỏi đội của bạn không? Hành động này không thể hoàn tác.
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="closeDeleteDialog">Hủy</v-btn>
                <v-btn color="error" @click="handleDelete" :loading="teamStore.loading">Xóa</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/auth';

const teamStore = useTeamStore();
const authStore = useAuthStore();

// --- State cho Bảng dữ liệu ---
const headers = [
  { title: 'Họ và tên', value: 'first_name', sortable: true },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Vai trò', value: 'role', sortable: true },
  { title: 'Đăng nhập lần cuối', value: 'last_login_at', sortable: true },
  { title: 'Hành động', value: 'actions', sortable: false },
];

// --- State cho Dialog mời ---
const inviteDialog = ref(false);
const inviteForm = ref(null);
const inviteError = ref(null);
const invitation = reactive({
  email: '',
  role: 'member', // Mặc định là member
});
const rules = {
  required: value => !!value || 'Trường này là bắt buộc.',
  email: value => /.+@.+\..+/.test(value) || 'Email không hợp lệ.',
};

// --- State cho Dialog xóa ---
const deleteDialog = ref(false);
const memberToDelete = ref(null);

// --- Vòng đời Component ---
onMounted(() => {
  // Khi component được tải, gọi action để lấy danh sách thành viên
  teamStore.fetchMembers();
});

// --- Hàm xử lý cho Dialog mời ---
const openInviteDialog = () => {
  inviteDialog.value = true;
};
const closeInviteDialog = () => {
  inviteDialog.value = false;
  inviteError.value = null; // Xóa lỗi cũ
  inviteForm.value?.reset(); // Reset form
};
const handleInvite = async () => {
  const { valid } = await inviteForm.value.validate();
  if (valid) {
    const success = await teamStore.inviteMember(invitation);
    if (success) {
      closeInviteDialog();
    } else {
        // Gán lỗi trả về từ store để hiển thị trong dialog
        inviteError.value = teamStore.error;
    }
  }
};

// --- Hàm xử lý cho Dialog xóa ---
const openDeleteDialog = (member) => {
  memberToDelete.value = member;
  deleteDialog.value = true;
};
const closeDeleteDialog = () => {
  deleteDialog.value = false;
  memberToDelete.value = null;
};
const handleDelete = async () => {
  if (memberToDelete.value) {
    await teamStore.removeMember(memberToDelete.value.id);
    closeDeleteDialog();
  }
};


// --- Hàm tiện ích ---
const getRoleColor = (role) => {
  if (role === 'owner') return 'primary';
  if (role === 'admin') return 'secondary';
  return 'grey';
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'Chưa đăng nhập';
  return new Date(dateTimeString).toLocaleString('vi-VN');
};
</script>