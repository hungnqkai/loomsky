<template>
  <v-container fluid class="style-guide pa-6">
    <h1 class="text-h4 font-weight-bold mb-2">LoomSky Design System & Style Guide</h1>
    <p class="text-medium-emphasis mb-8">
      Đây là tài liệu trực quan cho các components và design tokens được chuẩn hóa của dự án.
    </p>

    <!-- Section: Colors -->
    <section>
      <h2 class="section-title">1. Bảng Màu (Colors)</h2>
      <p class="section-subtitle">Luôn sử dụng các biến CSS được định nghĩa trong `tokens.scss`.</p>
      
      <v-row>
        <v-col cols="12">
          <h3 class="swatch-group-title">Primary & Secondary</h3>
          <div class="swatches-container">
            <div class="swatch-item" v-for="color in primaryColors" :key="color.name">
              <div class="swatch-color" :style="{ backgroundColor: `var(${color.var})` }"></div>
              <div class="swatch-info">
                <span class="font-weight-medium">{{ color.name }}</span>
                <code class="code-snippet">{{ color.var }}</code>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12">
           <h3 class="swatch-group-title">Feedback Colors</h3>
          <div class="swatches-container">
            <div class="swatch-item" v-for="color in feedbackColors" :key="color.name">
              <div class="swatch-color" :style="{ backgroundColor: `var(${color.var})` }"></div>
              <div class="swatch-info">
                <span class="font-weight-medium">{{ color.name }}</span>
                <code class="code-snippet">{{ color.var }}</code>
              </div>
            </div>
          </div>
        </v-col>
        <v-col cols="12">
           <h3 class="swatch-group-title">Neutral Colors</h3>
          <div class="swatches-container">
            <div class="swatch-item" v-for="color in neutralColors" :key="color.name">
              <div class="swatch-color" :style="{ backgroundColor: `var(${color.var})` }"></div>
              <div class="swatch-info">
                <span class="font-weight-medium">{{ color.name }}</span>
                <code class="code-snippet">{{ color.var }}</code>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </section>

    <!-- Section: Typography -->
    <v-divider class="my-8"></v-divider>
    <section>
      <h2 class="section-title">2. Kiểu Chữ (Typography)</h2>
      <p class="section-subtitle">Sử dụng các class helper của Vuetify hoặc biến CSS cho font-size.</p>
        <div class="py-4">
            <p class="text-h1">Heading 1</p>
            <p class="text-h2">Heading 2</p>
            <p class="text-h3">Heading 3</p>
            <p class="text-h4">Heading 4</p>
            <p class="text-h5">Heading 5</p>
            <p class="text-h6">Heading 6</p>
            <p class="text-body-1">
                Body 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.
            </p>
            <p class="text-body-2">
                Body 2: Sed vel enim sit amet nunc viverra dapibus. Nulla suscipit ligula in lacus.
            </p>
            <p class="text-caption">
                Caption: Curabitur sodales ligula in libero.
            </p>
        </div>
    </section>
    
    <!-- Section: Buttons -->
    <v-divider class="my-8"></v-divider>
    <section>
        <h2 class="section-title">3. Buttons</h2>
        <!-- SỬA LỖI 1: Escape a character < and > -->
        <p class="section-subtitle">Quy tắc sử dụng các biến thể của `&lt;v-btn&gt;`.</p>
        
        <v-card class="pa-4">
            <h3 class="mb-4">Primary Actions (Hành động chính)</h3>
            <p>Sử dụng `variant="tonal"` và `color="primary"`.</p>
            <div class="component-showcase">
                <v-btn color="primary" variant="tonal" size="small">Small Button</v-btn>
                <v-btn color="primary" variant="tonal">Default Button</v-btn>
                <v-btn color="primary" variant="tonal" size="large">Large Button</v-btn>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-check-circle">With Icon</v-btn>
                <v-btn color="primary" variant="tonal" :loading="true">Loading</v-btn>
            </div>
            
            <h3 class="my-4">Secondary Actions (Hành động phụ)</h3>
            <p>Sử dụng `variant="outlined"`.</p>
            <div class="component-showcase">
                <v-btn variant="outlined" size="small">Small Button</v-btn>
                <v-btn variant="outlined">Default Button</v-btn>
                <v-btn variant="outlined" size="large">Large Button</v-btn>
            </div>

            <h3 class="my-4">Destructive Actions (Hành động nguy hiểm)</h3>
            <p>Sử dụng `color="error"`.</p>
            <div class="component-showcase">
                 <v-btn color="error" variant="tonal">Hủy gói cước</v-btn>
                 <v-btn color="error" variant="flat">Xóa vĩnh viễn</v-btn>
                 <v-btn color="error" variant="outlined">Xóa thành viên</v-btn>
            </div>
        </v-card>
    </section>
    
    <!-- Section: Forms -->
    <v-divider class="my-8"></v-divider>
    <section>
        <h2 class="section-title">4. Forms & Inputs</h2>
        <p class="section-subtitle">Thống nhất sử dụng `variant="outlined"` và `density="compact"`.</p>

        <v-card class="pa-4">
            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Email"
                        placeholder="Nhập địa chỉ email"
                        variant="outlined"
                        density="compact"
                        prepend-inner-icon="mdi-email-outline"
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        label="Password"
                        type="password"
                        variant="outlined"
                        density="compact"
                        prepend-inner-icon="mdi-lock-outline"
                        error
                        error-messages="Mật khẩu không đúng."
                    ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                    <v-select
                        label="Vai trò"
                        :items="['Admin', 'Member', 'Viewer']"
                        variant="outlined"
                        density="compact"
                    ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                     <v-checkbox
                        label="Tôi đồng ý với các điều khoản"
                        density="compact"
                    ></v-checkbox>
                </v-col>
            </v-row>
        </v-card>
    </section>

     <!-- Section: Tables -->
    <v-divider class="my-8"></v-divider>
    <section>
        <h2 class="section-title">5. Data Tables</h2>
        <!-- SỬA LỖI 1: Escape a character < and > -->
        <p class="section-subtitle">Sử dụng `&lt;v-data-table&gt;` với `elevation-1`.</p>
        <v-card>
             <v-data-table
                :headers="tableHeaders"
                :items="tableItems"
                class="elevation-1"
                item-value="name"
            >
                <!-- SỬA LỖI 2: Use # shorthand for v-slot -->
                <template #item.role="{ item }">
                    <v-chip :color="item.role === 'Owner' ? 'primary' : 'secondary'" size="small">{{ item.role }}</v-chip>
                </template>
                <!-- SỬA LỖI 2: Use # shorthand for v-slot -->
                <template #item.actions="{ item }">
                    <v-tooltip text="Edit">
                        <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" small class="mr-2">mdi-pencil-outline</v-icon>
                        </template>
                    </v-tooltip>
                     <v-tooltip text="Delete">
                        <template v-slot:activator="{ props }">
                           <v-icon v-bind="props" small color="error">mdi-delete-outline</v-icon>
                        </template>
                    </v-tooltip>
                </template>
            </v-data-table>
        </v-card>
    </section>

  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const primaryColors = [
  { name: 'Primary', var: '--loomsky-primary' },
  { name: 'Primary Light', var: '--loomsky-primary-light' },
  { name: 'Primary Dark', var: '--loomsky-primary-dark' },
  { name: 'Secondary', var: '--loomsky-secondary' },
  { name: 'Secondary Light', var: '--loomsky-secondary-light' },
  { name: 'Secondary Dark', var: '--loomsky-secondary-dark' },
];

const feedbackColors = [
  { name: 'Success', var: '--loomsky-success' },
  { name: 'Warning', var: '--loomsky-warning' },
  { name: 'Error', var: '--loomsky-error' },
  { name: 'Info', var: '--loomsky-info' },
];

const neutralColors = [
  { name: 'Neutral 900', var: '--loomsky-neutral-900' },
  { name: 'Neutral 700', var: '--loomsky-neutral-700' },
  { name: 'Neutral 500', var: '--loomsky-neutral-500' },
  { name: 'Neutral 300', var: '--loomsky-neutral-300' },
  { name: 'Neutral 100', var: '--loomsky-neutral-100' },
  { name: 'Neutral 50', var: '--loomsky-neutral-50' },
  { name: 'White', var: '--loomsky-white' },
];

const tableHeaders = ref([
  { title: 'Họ và tên', value: 'name' },
  { title: 'Email', value: 'email' },
  { title: 'Vai trò', value: 'role' },
  { title: 'Hành động', value: 'actions', sortable: false, align: 'end' },
]);

const tableItems = ref([
  { name: 'John Doe', email: 'john.doe@example.com', role: 'Owner' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Admin' },
  { name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Member' },
]);

</script>

<style scoped lang="scss">
.style-guide {
  h1, h2, h3 {
    font-family: 'Inter', sans-serif;
  }
  .section-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--loomsky-neutral-800);
    margin-bottom: 4px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--loomsky-neutral-200);
  }
  .section-subtitle {
    font-size: var(--font-size-lg);
    color: var(--loomsky-neutral-500);
    margin-bottom: 24px;
  }
  .swatches-container {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
  }
  .swatch-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .swatch-color {
    width: 120px;
    height: 80px;
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--loomsky-neutral-200);
    margin-bottom: 8px;
  }
  .swatch-info {
    display: flex;
    flex-direction: column;
    font-size: var(--font-size-sm);
  }
  .swatch-group-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    margin-bottom: 16px;
    color: var(--loomsky-neutral-700);
  }
  .code-snippet {
    background-color: var(--loomsky-neutral-100);
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
    color: var(--loomsky-secondary-dark);
  }
  .component-showcase {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background-color: var(--loomsky-neutral-50);
      border-radius: var(--border-radius-md);
  }
}
</style>
