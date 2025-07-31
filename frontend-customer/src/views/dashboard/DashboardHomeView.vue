<template>
  <div>
    <h1 class="mb-4">Dashboard</h1>
    <v-row>
      <v-col cols="12" md="4">
        <v-card
          color="primary"
          variant="tonal"
          title="Tổng số người dùng"
          text="1,234"
        >
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-account-group-outline" size="x-large" class="mr-2"></v-icon>
            <span class="text-h4 font-weight-bold">1,234</span>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          color="secondary"
          variant="tonal"
          title="Doanh thu tháng này"
          text="$5,678"
        >
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-cash-multiple" size="x-large" class="mr-2"></v-icon>
            <span class="text-h4 font-weight-bold">$5,678</span>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card
          color="success"
          variant="tonal"
          title="Tỷ lệ chuyển đổi"
          text="12.5%"
        >
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-chart-line" size="x-large" class="mr-2"></v-icon>
            <span class="text-h4 font-weight-bold">12.5%</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// Logic for fetching data will be added here later
</script>
