/*
File: src/database/migrations/20250808000001-add-event-constraints.js
- Add indexes và soft constraints cho event standardization
- Add metadata field cho standardization tracking
- Performance optimizations cho event querying
*/
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add metadata column để track standardization info
    await queryInterface.addColumn('Events', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Standardization metadata including validation results, Facebook compatibility, etc.'
    });

    // 2. Add composite indexes cho improved query performance
    await queryInterface.addIndex('Events', 
      ['event_name', 'timestamp'], 
      { 
        name: 'idx_events_name_timestamp',
        comment: 'Optimize queries filtering by event name and time range'
      }
    );

    await queryInterface.addIndex('Events', 
      ['session_id', 'event_name'], 
      { 
        name: 'idx_events_session_name',
        comment: 'Optimize session-based event queries'
      }
    );

    // 3. Add JSONB GIN index trên properties cho fast property searches
    await queryInterface.addIndex('Events', 
      ['properties'], 
      { 
        name: 'idx_events_properties_gin',
        using: 'gin',
        comment: 'Fast JSONB property searches using GIN index'
      }
    );

    // 4. Add JSONB GIN index trên metadata cho standardization queries  
    await queryInterface.addIndex('Events', 
      ['metadata'], 
      { 
        name: 'idx_events_metadata_gin',
        using: 'gin',
        comment: 'Fast metadata searches for standardization tracking'
      }
    );

    // 5. Add partial index cho Facebook-compatible events
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_facebook_compatible
      ON "Events" (event_name, timestamp)
      WHERE (metadata->>'facebook_compatible')::boolean = true;
    `);

    // 6. Add partial index cho validation failed events (for monitoring)
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_validation_failed
      ON "Events" (event_name, timestamp)
      WHERE (metadata->>'validation_passed')::boolean = false;
    `);

    console.log('✅ Event standardization constraints and indexes added successfully');
  },

  async down(queryInterface, Sequelize) {
    // Remove custom indexes first
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_events_facebook_compatible;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_events_validation_failed;');
    
    // Remove standard indexes
    await queryInterface.removeIndex('Events', 'idx_events_metadata_gin');
    await queryInterface.removeIndex('Events', 'idx_events_properties_gin');
    await queryInterface.removeIndex('Events', 'idx_events_session_name');
    await queryInterface.removeIndex('Events', 'idx_events_name_timestamp');
    
    // Remove metadata column
    await queryInterface.removeColumn('Events', 'metadata');
    
    console.log('✅ Event standardization constraints and indexes removed');
  }
};