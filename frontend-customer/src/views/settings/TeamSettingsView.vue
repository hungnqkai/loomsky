<template>
  <div class="team-settings-container">
    <!-- Enhanced Header Section -->
    <div class="page-header">
      <div class="search-filter-section">
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="outlined"
          placeholder="Search members..."
          prepend-inner-icon="mdi-magnify"
          class="search-field"
          hide-details
        ></v-text-field>
        <v-select
          v-model="roleFilter"
          :items="roleFilterOptions"
          density="compact"
          variant="outlined"
          placeholder="All Roles"
          class="filter-select"
          hide-details
        ></v-select>
        <v-select
          v-model="statusFilter"
          :items="statusFilterOptions"
          density="compact"
          variant="outlined"
          placeholder="All Status"
          class="filter-select"
          hide-details
        ></v-select>
      </div>
      <v-btn
        class="loomsky-button-primary invite-button"
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openInviteDialog"
      >
        Add Member
      </v-btn>
    </div>

    <!-- Thông báo -->
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

    <!-- Stats Cards -->
    <v-row class="stats-row mb-8">
      <v-col cols="6" md="3">
        <v-card class="stat-card text-center" elevation="1">
          <v-card-text class="pb-4">
            <div class="stat-icon total mb-3 mx-auto">
              <v-icon size="24" color="white">mdi-account-group</v-icon>
            </div>
            <div class="stat-value">{{ teamStats.total }}</div>
            <div class="stat-label">Total Members</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stat-card text-center" elevation="1">
          <v-card-text class="pb-4">
            <div class="stat-icon active mb-3 mx-auto">
              <v-icon size="24" color="white">mdi-account-check</v-icon>
            </div>
            <div class="stat-value">{{ teamStats.active }}</div>
            <div class="stat-label">Active</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stat-card text-center" elevation="1">
          <v-card-text class="pb-4">
            <div class="stat-icon pending mb-3 mx-auto">
              <v-icon size="24" color="white">mdi-account-clock</v-icon>
            </div>
            <div class="stat-value">{{ teamStats.pending }}</div>
            <div class="stat-label">Pending</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="stat-card text-center" elevation="1">
          <v-card-text class="pb-4">
            <div class="stat-icon admins mb-3 mx-auto">
              <v-icon size="24" color="white">mdi-shield-account</v-icon>
            </div>
            <div class="stat-value">{{ teamStats.admins }}</div>
            <div class="stat-label">Admins</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Enhanced Member Table -->
    <LoomSkyCard>
      <template #header>
        <div class="card-header">
          <div class="card-title">Team Members</div>
          <v-chip size="small" variant="flat" color="primary">
            {{ filteredMembers.length }} member{{ filteredMembers.length !== 1 ? 's' : '' }}
          </v-chip>
        </div>
      </template>

      <v-data-table
        :headers="enhancedHeaders"
        :items="filteredMembers"
        :loading="teamStore.loading"
        item-value="id"
        class="enhanced-table"
        hide-default-footer
        :items-per-page="-1"
      >
        <!-- Member Column với Avatar -->
        <template #item.member="{ item }">
          <div class="member-info">
            <v-avatar 
              :color="getAvatarColor(item)" 
              size="40" 
              class="member-avatar"
            >
              <span class="avatar-text">{{ getInitials(item) }}</span>
            </v-avatar>
            <div class="member-details">
              <div class="member-name">
                {{ item.first_name || item.email.split('@')[0] }}
                <span v-if="item.id === authStore.user.id" class="you-indicator">(You)</span>
              </div>
              <div class="member-email">{{ item.email }}</div>
            </div>
          </div>
        </template>

        <!-- Role Column với Badge -->
        <template #item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            variant="flat"
            size="small"
            :prepend-icon="getRoleIcon(item.role)"
            class="role-chip"
          >
            {{ formatRole(item.role) }}
          </v-chip>
        </template>

        <!-- Status Column với Indicator -->
        <template #item.status="{ item }">
          <div class="status-indicator" :class="item.status">
            <span class="status-dot"></span>
            <span class="status-text">{{ formatStatus(item.status) }}</span>
          </div>
        </template>

        <!-- Joined Date Column -->
        <template #item.joined_at="{ item }">
          <span class="joined-date">
            {{ item.status === 'pending' ? '-' : formatDate(item.created_at) }}
          </span>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="action-buttons">
            <!-- Status Toggle -->
            <v-switch
              :model-value="item.status === 'active'"
              @update:modelValue="handleStatusToggle(item)"
              color="success"
              density="compact"
              hide-details
              :disabled="isActionDisabled(item) || item.status === 'pending'"
              class="action-switch"
            ></v-switch>

            <!-- Edit Button -->
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              size="small"
              color="grey-darken-1"
              :disabled="isActionDisabled(item)"
              @click="openEditDialog(item)"
              class="action-btn"
            >
              <v-icon size="18">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">Edit role</v-tooltip>
            </v-btn>

            <!-- Delete Button -->
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              :disabled="isActionDisabled(item)"
              @click="openDeleteDialog(item)"
              class="action-btn"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">
                {{ item.status === 'pending' ? 'Cancel invitation' : 'Remove member' }}
              </v-tooltip>
            </v-btn>
          </div>
        </template>

        <!-- Empty State -->
        <template #no-data>
          <div class="empty-state">
            <div class="empty-icon">
              <v-icon size="48" color="grey-lighten-1">mdi-account-group-outline</v-icon>
            </div>
            <h3 class="empty-title">No team members found</h3>
            <p class="empty-subtitle">
              {{ searchQuery || roleFilter || statusFilter ? 'Try adjusting your search or filters' : 'Start by inviting your first team member' }}
            </p>
            <v-btn
              v-if="!searchQuery && !roleFilter && !statusFilter"
              color="primary"
              variant="flat"
              @click="openInviteDialog"
              class="mt-4"
            >
              Invite Team Member
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </LoomSkyCard>

    <!-- Dialog Mời thành viên -->
    <v-dialog v-model="inviteDialog" max-width="500px" persistent>
      <LoomSkyCard>
        <template #header>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Invite New Member</span>
            <v-btn icon="mdi-close" variant="text" @click="closeInviteDialog"></v-btn>
          </v-card-title>
        </template>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="inviteForm">
            <v-text-field
              v-model="invitation.email"
              label="Email"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              density="compact"
              type="email"
              class="mb-4"
            ></v-text-field>
            <v-select
              v-model="invitation.role"
              :items="roleOptions"
              label="Role"
              :rules="[rules.required]"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="tonal"
            @click="closeInviteDialog"
            class="mr-2"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleInvite"
            :loading="teamStore.loading"
          >
            Send Invitation
          </v-btn>
        </v-card-actions>
      </LoomSkyCard>
    </v-dialog>

    <!-- Dialog Chỉnh sửa vai trò -->
    <v-dialog v-model="editDialog" max-width="500px" persistent>
      <LoomSkyCard>
        <template #header>
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h5">Update Member Role</span>
            <v-btn icon="mdi-close" variant="text" @click="closeEditDialog"></v-btn>
          </v-card-title>
        </template>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <p class="mb-4">
            Change role for <strong>{{ memberToEdit?.email }}</strong>
          </p>
          <v-select
            v-model="editedRole"
            :items="roleOptions"
            label="New Role"
            variant="outlined"
            density="compact"
          ></v-select>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="tonal"
            @click="closeEditDialog"
            class="mr-2"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleUpdateRole"
            :loading="teamStore.loading"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </LoomSkyCard>
    </v-dialog>

    <!-- Dialog Xác nhận Xóa -->
    <ConfirmDialog
      v-model="deleteDialog"
      title="Confirm Action"
      :message="deleteMessage"
      :confirm-text="memberToDelete?.status === 'pending' ? 'Cancel Invitation' : 'Remove Member'"
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

// --- Enhanced State ---
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');

// --- Table Headers ---
const enhancedHeaders = [
  { title: 'Member', value: 'member', sortable: false, width: '40%' },
  { title: 'Role', value: 'role', sortable: true, width: '15%' },
  { title: 'Status', value: 'status', sortable: true, width: '15%' },
  { title: 'Joined', value: 'joined_at', sortable: true, width: '15%' },
  { title: 'Actions', value: 'actions', sortable: false, align: 'end', width: '15%' },
];

// --- Filter Options ---
const roleFilterOptions = [
  { title: 'All Roles', value: '' },
  { title: 'Admin', value: 'admin' },
  { title: 'Member', value: 'member' },
  { title: 'Viewer', value: 'viewer' },
];

const statusFilterOptions = [
  { title: 'All Status', value: '' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Pending', value: 'pending' },
];

const roleOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'Member', value: 'member' },
  { title: 'Viewer', value: 'viewer' },
];

// --- State cho Dialogs (giữ nguyên logic cũ) ---
const inviteDialog = ref(false);
const inviteForm = ref(null);
const invitation = reactive({ email: '', role: 'member' });

const editDialog = ref(false);
const memberToEdit = ref(null);
const editedRole = ref('');

const deleteDialog = ref(false);
const memberToDelete = ref(null);

const rules = {
  required: value => !!value || 'This field is required.',
  email: value => /.+@.+\..+/.test(value) || 'Invalid email.',
};

// --- Computed Properties ---
const filteredMembers = computed(() => {
  let members = teamStore.members || [];
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    members = members.filter(member => 
      (member.first_name && member.first_name.toLowerCase().includes(query)) ||
      member.email.toLowerCase().includes(query)
    );
  }
  
  // Role filter
  if (roleFilter.value) {
    members = members.filter(member => member.role === roleFilter.value);
  }
  
  // Status filter
  if (statusFilter.value) {
    members = members.filter(member => member.status === statusFilter.value);
  }
  
  return members;
});

const teamStats = computed(() => {
  const members = teamStore.members || [];
  return {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    admins: members.filter(m => m.role === 'admin' || m.role === 'owner').length,
  };
});

const deleteMessage = computed(() => {
  if (!memberToDelete.value) return '';
  const action = memberToDelete.value.status === 'pending' ? 'cancel the invitation for' : 'remove';
  return `Are you sure you want to ${action} <strong>${memberToDelete.value.email}</strong>?`;
});

// --- Utility Functions ---
const getInitials = (member) => {
  if (member.first_name) {
    return member.first_name.charAt(0).toUpperCase();
  }
  return member.email.charAt(0).toUpperCase();
};

const getAvatarColor = (member) => {
  const colors = {
    owner: 'secondary',
    admin: 'secondary', 
    member: 'primary',
    viewer: 'grey-darken-1'
  };
  if (member.status === 'pending') return 'warning';
  return colors[member.role] || 'primary';
};

const getRoleColor = (role) => {
  const colors = {
    owner: 'secondary',
    admin: 'secondary',
    member: 'primary', 
    viewer: 'grey-darken-1'
  };
  return colors[role] || 'primary';
};

const getRoleIcon = (role) => {
  const icons = {
    owner: 'mdi-crown',
    admin: 'mdi-shield-account',
    member: 'mdi-account',
    viewer: 'mdi-eye'
  };
  return icons[role] || 'mdi-account';
};

const formatRole = (role) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// --- Logic Functions (giữ nguyên từ code cũ) ---
onMounted(() => { teamStore.fetchMembers(); });

const openInviteDialog = () => { inviteDialog.value = true; };
const closeInviteDialog = () => {
  inviteDialog.value = false;
  inviteForm.value?.reset();
  invitation.email = '';
  invitation.role = 'member';
};

const handleInvite = async () => {
  const { valid } = await inviteForm.value.validate();
  if (valid) {
    const success = await teamStore.inviteMember(invitation);
    if (success) closeInviteDialog();
  }
};

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

const handleStatusToggle = (member) => {
  const newStatus = member.status === 'active' ? 'inactive' : 'active';
  teamStore.updateMember(member.id, { status: newStatus });
};

const isActionDisabled = (member) => {
  return member.id === authStore.user.id || member.role === 'owner';
};
</script>

<style scoped lang="scss">
.team-settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header Section */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--spacing-6);
  gap: var(--spacing-4);
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-4);
  }
}

.search-filter-section {
  display: flex;
  gap: var(--spacing-4);
  align-items: center;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
}

.search-field {
  min-width: 250px;
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
}

.filter-select {
  min-width: 120px;
}

.invite-button {
  white-space: nowrap;
}

/* Stats Cards */
.stats-row {
  margin-bottom: var(--spacing-8);
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(133, 146, 173, 0.3) !important;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.total { background: var(--loomsky-primary); }
  &.active { background: var(--loomsky-success); }
  &.pending { background: var(--loomsky-warning); }
  &.admins { background: var(--loomsky-secondary); }
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--loomsky-text-title);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--loomsky-text-body);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--loomsky-neutral-100);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--loomsky-text-title);
}

/* Enhanced Table */
.enhanced-table {
  :deep(.v-data-table__wrapper) {
    overflow-x: auto;
  }
  
  :deep(.v-data-table-header) {
    background: var(--loomsky-neutral-50);
  }
  
  :deep(.v-data-table-header th) {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--loomsky-text-body);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--loomsky-neutral-200);
  }
  
  :deep(.v-data-table__tr) {
    border-bottom: 1px solid var(--loomsky-neutral-100);
    
    &:hover {
      background: var(--loomsky-neutral-50);
    }
  }
  
  :deep(.v-data-table__td) {
    padding: var(--spacing-5) var(--spacing-6);
    vertical-align: middle;
  }
}

/* Member Info */
.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.member-avatar {
  flex-shrink: 0;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-text {
  font-weight: 600;
  font-size: 0.875rem;
}

.member-details {
  min-width: 0;
}

.member-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--loomsky-text-title);
  margin-bottom: 2px;
}

.you-indicator {
  font-weight: 400;
  color: var(--loomsky-text-body);
  font-size: 0.875rem;
}

.member-email {
  font-size: var(--font-size-sm);
  color: var(--loomsky-text-body);
  word-break: break-word;
}

/* Role Chip */
.role-chip {
  text-transform: capitalize;
  font-weight: 500;
}

/* Status Indicator */
.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);
  font-weight: 500;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.active {
    color: var(--loomsky-success);
    .status-dot { background: var(--loomsky-success); }
  }
  
  &.inactive {
    color: var(--loomsky-neutral-500);
    .status-dot { background: var(--loomsky-neutral-400); }
  }
  
  &.pending {
    color: var(--loomsky-warning);
    .status-dot { background: var(--loomsky-warning); }
  }
}

.joined-date {
  font-size: var(--font-size-sm);
  color: var(--loomsky-text-body);
}

/* Action Buttons */
.action-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

.action-switch {
  :deep(.v-input__control) {
    min-height: auto;
  }
}

.action-btn {
  min-width: 32px;
  width: 32px;
  height: 32px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--loomsky-text-body);
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--loomsky-neutral-100);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-4) auto;
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--loomsky-text-title);
  margin-bottom: var(--spacing-2);
}

.empty-subtitle {
  color: var(--loomsky-text-body);
  margin-bottom: var(--spacing-4);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .member-info {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2);
  }
  
  .action-buttons {
    flex-direction: column;
    gap: var(--spacing-1);
  }
  
  :deep(.v-data-table__wrapper) {
    font-size: var(--font-size-sm);
  }
}
</style>