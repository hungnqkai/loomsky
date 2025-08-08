<!-- 
File: src/components/tracking/BlacklistManager.vue (REDESIGNED)
- Modern card-based design with enhanced UX
-->
<template>
    <div class="blacklist-manager">
        <!-- Header Section -->
        <v-card class="header-section mb-6" rounded="lg" elevation="0">
            <v-card-text class="pa-8">
                <div class="d-flex justify-space-between align-start">
                    <div class="d-flex align-start" style="gap: 20px;">
                        <v-avatar size="60" rounded="lg" color="error">
                            <v-icon size="32" color="white">mdi-shield-remove</v-icon>
                        </v-avatar>
                        <div style="flex: 1;">
                            <h2 class="text-h5 font-weight-bold text--primary mb-2">Blacklist Management</h2>
                            <p class="text-body-1 text--secondary" style="max-width: 600px; line-height: 1.6;">
                                Block data collection from specific IP addresses, users, or email addresses. These rules apply to your entire site and help maintain Facebook Pixel data quality by eliminating events sent to Facebook via Pixel and CAPI.
                            </p>
                        </div>
                    </div>
                    <v-card rounded="lg" color="error" variant="tonal" style="min-width: 140px;">
                        <v-card-text class="pa-5 text-center">
                            <div class="text-h4 font-weight-bold text-error mb-1">{{ blacklistCount }}</div>
                            <div class="text-caption font-weight-medium text-error">Blocked items</div>
                        </v-card-text>
                    </v-card>
                </div>
            </v-card-text>
        </v-card>

        <!-- Alert Messages -->
        <v-alert v-if="websiteStore.error" type="error" class="mb-6" closable @click:close="websiteStore.clearMessages()">
            {{ websiteStore.error }}
        </v-alert>
        <v-alert v-if="websiteStore.successMessage" type="success" class="mb-6" closable @click:close="websiteStore.clearMessages()">
            {{ websiteStore.successMessage }}
        </v-alert>

        <!-- Add New Entry Section -->
        <v-card class="add-section mb-6" rounded="lg" elevation="0">
            <v-card-text class="pa-8">
                <div class="mb-6">
                    <h3 class="text-h6 font-weight-bold mb-2">Add New Blacklist</h3>
                    <p class="text-body-2 text--secondary">Block specific IPs, users, emails or phone numbers from tracking</p>
                </div>
                
                <v-card rounded="lg" class="pa-6 add-form-card">
                    <v-form ref="form" @submit.prevent="addEntry">
                        <v-row align="end" style="gap: 20px;">
                            <v-col cols="12" md="3">
                                <v-label class="text-body-2 font-weight-medium mb-2">Type</v-label>
                                <v-select 
                                    v-model="newItem.type" 
                                    :items="typeOptions" 
                                    :rules="[rules.required]" 
                                    variant="outlined" 
                                    hide-details
                                >
                                    <template v-slot:selection="{ item }">
                                        <div class="d-flex align-center">
                                            <v-icon :color="getTypeColor(item.value)" class="mr-3">{{ getTypeIcon(item.value) }}</v-icon>
                                            <span>{{ item.title }}</span>
                                        </div>
                                    </template>
                                    <template v-slot:item="{ props, item }">
                                        <v-list-item v-bind="props">
                                            <template v-slot:prepend>
                                                <v-icon :color="getTypeColor(item.value)">{{ getTypeIcon(item.value) }}</v-icon>
                                            </template>
                                        </v-list-item>
                                    </template>
                                </v-select>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-label class="text-body-2 font-weight-medium mb-2">{{ getTypeLabel(newItem.type) }}</v-label>
                                <v-text-field 
                                    v-model="newItem.value" 
                                    :placeholder="getTypePlaceholder(newItem.type)"
                                    :rules="[rules.required]" 
                                    variant="outlined" 
                                    hide-details
                                ></v-text-field>
                            </v-col>
                            <v-col cols="12" md="2">
                                <v-btn 
                                    type="submit" 
                                    color="primary" 
                                    block 
                                    size="large"
                                    :loading="websiteStore.actionLoading"
                                    prepend-icon="mdi-plus"
                                >
                                    Add to Blacklist
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card>
            </v-card-text>
        </v-card>

        <!-- Blacklist Content -->
        <v-card class="blacklist-content" rounded="lg" elevation="0">
            <v-card-text class="pa-8">
                
                <div class="d-flex justify-space-between align-center mb-6">
                    <h4 class="text-h6 font-weight-bold">Blacklist Items</h4>
                    <div class="d-flex justify-space-between align-center" style="gap: 24px;">
                        <div class="d-flex align-center" style="gap: 20px; flex: 1;">
                            <!-- Search -->
                            <input 
                                type="text" 
                                class="search-input" 
                                placeholder="Search blacklist item..."
                                v-model="searchTerm"
                            >
                            
                            <!-- Type Filters -->
                            <div class="d-flex" style="gap: 8px;">
                                <v-btn 
                                    v-for="filter in filterOptions" 
                                    :key="filter.value"
                                    :class="activeFilter === filter.value ? 'active' : ''"
                                    :variant="activeFilter === filter.value ? 'flat' : 'flat'"
                                    size="small"
                                    @click="setFilter(filter.value)"
                                    class="filter-btn"
                                >
                                    <v-icon class="mr-1" size="14">{{ filter.icon }}</v-icon>
                                    {{ filter.title }}
                                    <v-chip 
                                        v-if="filter.count > 0"
                                        :color="activeFilter === filter.value ? 'white' : 'grey'"
                                        size="x-small"
                                        class="ml-1"
                                    >
                                        {{ filter.count }}
                                    </v-chip>
                                </v-btn>
                            </div>
                        </div>

                        <!-- Bulk Actions -->
                        <div v-if="selectedItems.length > 0">
                            <v-btn 
                                color="error" 
                                prepend-icon="mdi-delete"
                                @click="confirmBulkDelete"
                            >
                                Delete selected ({{ selectedItems.length }})
                            </v-btn>
                        </div>
                    </div>
                </div>

                <!-- Items Grid -->
                <div v-if="filteredItems.length > 0" class="blacklist-grid">
                    <div 
                        v-for="item in filteredItems" 
                        :key="item.id"
                        class="blacklist-item"
                        :class="{ selected: selectedItems.includes(item.id) }"
                        @click="toggleSelection(item.id)"
                    >
                        <v-checkbox 
                            :model-value="selectedItems.includes(item.id)"
                            hide-details
                            density="compact"
                            @click.stop
                            @update:model-value="toggleSelection(item.id)"
                        ></v-checkbox>
                        
                        <v-avatar :color="getTypeColor(item.type)" size="44" rounded="lg">
                            <v-icon color="white" size="18">{{ getTypeIcon(item.type) }}</v-icon>
                        </v-avatar>
                        
                        <div class="item-content">
                            <div class="text-caption font-weight-medium text--secondary text-uppercase" style="letter-spacing: 0.5px;">
                                {{ getTypeTitle(item.type) }}
                            </div>
                            <div class="text-body-1 font-weight-semibold">{{ item.value }}</div>
                        </div>
                        
                        <div class="item-actions">
                            <v-btn
                                icon
                                size="small"
                                color="error"
                                variant="tonal"
                                @click.stop="confirmDelete(item)"
                            >
                                <v-icon size="16">mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="empty-state text-center py-16">
                    <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-shield-remove-outline</v-icon>
                    <h3 class="text-h6 font-weight-semibold mb-3">No items Blacklist</h3>
                    <p class="text-body-1 text--secondary mb-6" style="max-width: 400px; margin: 0 auto;">
                        Your blacklist is empty. Add an IP address, email, or user ID to start blocking unwanted traffic and improving the quality of your data.
                    </p>
                </div>
            </v-card-text>
        </v-card>

        <!-- Delete Confirmation Dialog -->
        <v-dialog v-model="deleteDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h6">Confirm deletion</v-card-title>
                <v-card-text>
                    <p v-if="selectedItems.length > 1">
                        Are you sure you want to delete {{ selectedItems.length }} selected item from block list?
                    </p>
                    <p v-else-if="itemToDelete">
                        Are you sure you want to delete? "{{ itemToDelete.value }}" from block list?
                    </p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="deleteDialog = false">Cancel</v-btn>
                    <v-btn color="error" @click="executeDelete">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useWebsiteStore } from '@/stores/websiteStore';

const props = defineProps({ websiteId: { type: String, required: true } });
const websiteStore = useWebsiteStore();

// Form and data
const form = ref(null);
const defaultItem = { type: 'ip', value: '' };
const newItem = reactive({ ...defaultItem });
const rules = { required: v => !!v || 'Bắt buộc.' };

// Search and filter
const searchTerm = ref('');
const activeFilter = ref('all');
const selectedItems = ref([]);

// Dialog states
const deleteDialog = ref(false);
const itemToDelete = ref(null);

// Type configurations
const typeConfigs = {
    ip: {
        title: 'IP Address',
        icon: 'mdi-web',
        color: 'blue',
        placeholder: 'example: 192.168.1.100 or 10.0.0.0/24'
    },
    user_id: {
        title: 'User ID',
        icon: 'mdi-account',
        color: 'green',
        placeholder: 'example: user_12345'
    },
    email: {
        title: 'Email Address',
        icon: 'mdi-email',
        color: 'orange',
        placeholder: 'example: spam@example.com'
    },
    phone: {
        title: 'Phone',
        icon: 'mdi-phone',
        color: 'purple',
        placeholder: 'example: +84-xxx-xxx-xxx'
    }
};

// Computed properties
const typeOptions = computed(() => [
    { title: 'IP Address', value: 'ip' },
    { title: 'User ID', value: 'user_id' },
    { title: 'Email Address', value: 'email' },
    { title: 'Phone', value: 'phone' }
]);

const blacklistCount = computed(() => websiteStore.blacklist?.length || 0);

const filteredItems = computed(() => {
    let items = websiteStore.blacklist || [];
    
    // Apply type filter
    if (activeFilter.value !== 'all') {
        items = items.filter(item => item.type === activeFilter.value);
    }
    
    // Apply search filter
    if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        items = items.filter(item => 
            item.value.toLowerCase().includes(term) ||
            getTypeTitle(item.type).toLowerCase().includes(term)
        );
    }
    
    return items;
});

const filterOptions = computed(() => {
    const blacklist = websiteStore.blacklist || [];
    return [
        {
            title: 'All',
            value: 'all',
            icon: 'mdi-magnify',
            count: blacklist.length
        },
        {
            title: 'IP',
            value: 'ip',
            icon: 'mdi-web',
            count: blacklist.filter(item => item.type === 'ip').length
        },
        {
            title: 'Email',
            value: 'email',
            icon: 'mdi-email',
            count: blacklist.filter(item => item.type === 'email').length
        },
        {
            title: 'User ID',
            value: 'user_id',
            icon: 'mdi-account',
            count: blacklist.filter(item => item.type === 'user_id').length
        },
        {
            title: 'Phone',
            value: 'phone',
            icon: 'mdi-phone',
            count: blacklist.filter(item => item.type === 'phone').length
        }
    ];
});

// Methods
const getTypeColor = (type) => typeConfigs[type]?.color || 'grey';
const getTypeIcon = (type) => typeConfigs[type]?.icon || 'mdi-help';
const getTypeTitle = (type) => typeConfigs[type]?.title || type;
const getTypeLabel = (type) => typeConfigs[type]?.title || 'Giá trị';
const getTypePlaceholder = (type) => typeConfigs[type]?.placeholder || 'Nhập giá trị...';

const addEntry = async () => {
    const { valid } = await form.value.validate();
    if (!valid) return;
    
    const success = await websiteStore.addBlacklistEntry(props.websiteId, newItem);
    if (success) {
        form.value.reset();
        Object.assign(newItem, defaultItem);
        form.value.resetValidation();
        // Clear selection after adding
        selectedItems.value = [];
    }
};

const confirmDelete = (item) => {
    itemToDelete.value = item;
    deleteDialog.value = true;
};

const confirmBulkDelete = () => {
    itemToDelete.value = null;
    deleteDialog.value = true;
};

const executeDelete = async () => {
    if (selectedItems.value.length > 1) {
        // Bulk delete
        const deletePromises = selectedItems.value.map(id => 
            websiteStore.deleteBlacklistEntry(props.websiteId, id)
        );
        await Promise.all(deletePromises);
        selectedItems.value = [];
    } else if (itemToDelete.value) {
        // Single delete
        await websiteStore.deleteBlacklistEntry(props.websiteId, itemToDelete.value.id);
        selectedItems.value = selectedItems.value.filter(id => id !== itemToDelete.value.id);
    }
    
    deleteDialog.value = false;
    itemToDelete.value = null;
};

const toggleSelection = (itemId) => {
    const index = selectedItems.value.indexOf(itemId);
    if (index > -1) {
        selectedItems.value.splice(index, 1);
    } else {
        selectedItems.value.push(itemId);
    }
};

const setFilter = (filterValue) => {
    activeFilter.value = filterValue;
    selectedItems.value = []; // Clear selection when changing filter
};

const filterEntries = () => {
    selectedItems.value = []; // Clear selection when searching
};

// Load data on mount
onMounted(() => {
    if (websiteStore.selectedWebsite) {
        websiteStore.getWebsiteBlacklist(props.websiteId);
    }
});
</script>

<style scoped>
.header-section {
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
}

.add-section,
.controls-section,
.blacklist-content {
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
}

.add-form-card {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    box-shadow: none;
}

.blacklist-grid {
    display: grid;
    gap: 16px;
}

.blacklist-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.blacklist-item:hover {
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.blacklist-item.selected {
    border-color: rgb(var(--v-theme-primary));
    background: #f0f9ff;
}

.item-content {
    flex: 1;
}

.item-actions {
    display: flex;
    gap: 8px;
}

.empty-state {
    color: rgb(var(--v-theme-on-surface));
    opacity: 0.6;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .blacklist-manager {
        padding: 0 16px;
    }
    
    .header-section .d-flex {
        flex-direction: column !important;
        gap: 20px;
    }
    
    .controls-section .d-flex {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 16px;
    }
    
    .blacklist-item {
        padding: 16px;
    }
}

/* Vuetify overrides */

.v-label {
    display: block;
}

.filter-btn {
  padding: 10px 16px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
  text-transform: capitalize;
  height: unset;
}

.filter-btn:hover {
  background: #e2e8f0;
}

.filter-btn.active {
  background: #3b82f6;
  color: white;
}

.search-input {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-width: 200px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}
</style>