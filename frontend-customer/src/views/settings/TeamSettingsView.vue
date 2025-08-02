<template>
  <div>
    <!-- Header của trang -->
    <div class="d-flex justify-end align-center mb-4">
      <v-btn
        class="loomsky-button-primary"
        color="primary"
        variant="flat"
        @click="openInviteDialog">
        Add member
      </v-btn>
    </div>

    <!-- Thông báo -->
    <v-alert v-if="teamStore.successMessage" type="success" variant="tonal" class="mb-4" density="compact" closable @click:close="teamStore.clearMessages()">{{ teamStore.successMessage }}</v-alert>
    <v-alert v-if="teamStore.error" type="error" variant="tonal" class="mb-4" density="compact" closable @click:close="teamStore.clearMessages()">{{ teamStore.error }}</v-alert>

    <!-- Bảng danh sách thành viên -->
    <LoomSkyCard>
      <v-card-title class="loomsky-h2">Member List</v-card-title>
      <v-data-table
        :headers="headers"
        :items="teamStore.members"
        :loading="teamStore.loading"
        item-value="id"
        class="elevation-0"
      >
        <!-- Cột Trạng thái -->
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" class="font-weight-medium text-capitalize">
            {{ item.status }}
          </v-chip>
        </template>
        
        <!-- Cột Vai trò -->
        <template #item.role="{ item }">
          <span class="text-capitalize">{{ item.role }}</span>
        </template>

        <!-- Cột Hành động -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center justify-end">
            <!-- Nút gạt Active/Inactive -->
            <v-switch
              :model-value="item.status === 'active'"
              @update:modelValue="handleStatusToggle(item)"
              color="success"
              density="compact"
              hide-details
              :disabled="isActionDisabled(item)"
            ></v-switch>

            <!-- Nút Chỉnh sửa -->
            <v-tooltip text="Edit role">
              <template v-slot:activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-pencil-outline" 
                  variant="text" 
                  color="grey-darken-1"
                  :disabled="isActionDisabled(item)"
                  @click="openEditDialog(item)"
                ></v-btn>
              </template>
            </v-tooltip>

            <!-- Nút Xóa -->
            <v-tooltip text="Xóa thành viên">
              <template v-slot:activator="{ props }">
                <v-btn 
                  v-bind="props"
                  icon="mdi-delete-outline" 
                  variant="text" 
                  color="error"
                  :disabled="isActionDisabled(item)"
                  @click="openDeleteDialog(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </LoomSkyCard>

    <!-- Dialog Mời thành viên -->
    <v-dialog v-model="inviteDialog" max-width="500px" persistent>
      <v-card rounded="lg">
        <v-card-title><span class="text-h5">Invite new members</span></v-card-title>
        <v-card-text>
          <v-form ref="inviteForm">
            <v-text-field v-model="invitation.email" label="Email" :rules="[rules.required, rules.email]" variant="outlined" density="compact"></v-text-field>
            <v-select v-model="invitation.role" :items="['admin', 'member', 'viewer']" label="Role" :rules="[rules.required]" variant="outlined" density="compact"></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="loomsky-button-primary" color="error" variant="tonal" @click="closeInviteDialog">Cancel</v-btn>
          <v-btn class="loomsky-button-primary" color="primary" variant="flat" @click="handleInvite" :loading="teamStore.loading">Send invitation</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Chỉnh sửa vai trò -->
    <v-dialog v-model="editDialog" max-width="500px" persistent>
      <v-card rounded="lg">
        <v-card-title class="loomsky-h2">Update member</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Change roles for <strong>{{ memberToEdit?.email }}</strong>
          </p>
          <v-select v-model="editedRole" :items="['admin', 'member', 'viewer']" label="New role" variant="outlined" density="compact"></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn class="loomsky-button-primary" color="error" variant="tonal" @click="closeEditDialog">Cancel</v-btn>
          <v-btn class="loomsky-button-primary" color="primary" variant="flat" @click="handleUpdateRole" :loading="teamStore.loading">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Xác nhận Xóa -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Confirm deletion"
      :message="`Are you sure you want to delete the member? <strong>${memberToDelete?.email}</strong>?`"
      confirm-text="Confirm deletion"
      confirm-color="error"
      :loading="teamStore.loading"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useTeamStore } from '@/stores/teamStore';
import { useAuthStore } from '@/stores/auth';
import LoomSkyCard from '@/components/common/LoomSkyCard.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';

const teamStore = useTeamStore();
const authStore = useAuthStore();

// --- State cho Bảng ---
const headers = [
  { title: 'Name', value: 'first_name', sortable: true },
  { title: 'Email', value: 'email', sortable: true },
  { title: 'Role', value: 'role', sortable: true },
  { title: 'Status', value: 'status', sortable: true },
  { title: 'Action', value: 'actions', sortable: false, align: 'end' },
];

// --- State cho Dialogs ---
const inviteDialog = ref(false);
const inviteForm = ref(null);
const invitation = reactive({ email: '', role: 'member' });

const editDialog = ref(false);
const memberToEdit = ref(null);
const editedRole = ref('');

const deleteDialog = ref(false);
const memberToDelete = ref(null);

const rules = {
  required: value => !!value || 'Trường này là bắt buộc.',
  email: value => /.+@.+\..+/.test(value) || 'Email không hợp lệ.',
};

onMounted(() => { teamStore.fetchMembers(); });

// --- Logic Mời ---
const openInviteDialog = () => { inviteDialog.value = true; };
const closeInviteDialog = () => {
  inviteDialog.value = false;
  inviteForm.value?.reset();
};
const handleInvite = async () => {
  const { valid } = await inviteForm.value.validate();
  if (valid) {
    const success = await teamStore.inviteMember(invitation);
    if (success) closeInviteDialog();
  }
};

// --- Logic Chỉnh sửa ---
const openEditDialog = (member) => {
  memberToEdit.value = member;
  editedRole.value = member.role;
  editDialog.value = true;
};
const closeEditDialog = () => {
  editDialog.value = false;
  memberToEdit.value = null;
  editedRole.value = '';
};
const handleUpdateRole = async () => {
  if (memberToEdit.value && editedRole.value) {
    const success = await teamStore.updateMember(memberToEdit.value.id, { role: editedRole.value });
    if (success) closeEditDialog();
  }
};

// --- Logic Xóa ---
const openDeleteDialog = (member) => {
  memberToDelete.value = member;
  deleteDialog.value = true;
};
const handleDelete = async () => {
  if (memberToDelete.value) {
    await teamStore.removeMember(memberToDelete.value.id);
    deleteDialog.value = false; 
    memberToDelete.value = null;
  }
};

// --- Logic Thay đổi Trạng thái ---
const handleStatusToggle = (member) => {
  const newStatus = member.status === 'active' ? 'inactive' : 'active';
  teamStore.updateMember(member.id, { status: newStatus });
};

// --- Hàm Tiện ích ---
const isActionDisabled = (member) => {
  // Không cho phép thực hiện hành động trên chính mình hoặc trên owner
  return member.id === authStore.user.id || member.role === 'owner';
};

const getStatusColor = (status) => {
  const map = { active: 'success', inactive: 'grey', pending: 'warning' };
  return map[status] || 'grey';
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'Chưa đăng nhập';
  return new Date(dateTimeString).toLocaleString('vi-VN');
};
</script>
