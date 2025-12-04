import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from backend .env.local
dotenv.config({ path: '/Volumes/SSD02/Private/Dev/OpenWardrobeMarket/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findAndDeleteItem() {
  try {
    console.log('Searching for "BOXY IN DEEP CHARCOAL" item...');

    // Search in published_items
    const { data: publishedItems, error: publishedError } = await supabase
      .from('published_items')
      .select('id, title, poster_url, original_url, created_at')
      .ilike('title', '%BOXY IN DEEP CHARCOAL%');

    if (publishedError) {
      console.error('Error searching published_items:', publishedError);
    } else if (publishedItems && publishedItems.length > 0) {
      console.log('\nFound in published_items:');
      publishedItems.forEach((item: any, index: number) => {
        console.log(`\n[${index + 1}] ID: ${item.id}`);
        console.log(`    Title: ${item.title}`);
        console.log(`    Poster URL: ${item.poster_url || 'N/A'}`);
        console.log(`    Original URL: ${item.original_url || 'N/A'}`);
        console.log(`    Created: ${item.created_at}`);
      });

      // Delete the items
      console.log('\n\nDeleting items...');
      for (const item of publishedItems) {
        const { error: deleteError } = await supabase
          .from('published_items')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error(`Failed to delete item ${item.id}:`, deleteError);
        } else {
          console.log(`✓ Deleted item ${item.id} (${item.title})`);
        }
      }
    } else {
      console.log('No items found in published_items');
    }

    // Search in user_generations
    const { data: userGens, error: userGensError } = await supabase
      .from('user_generations')
      .select('id, title, image_id, created_at')
      .ilike('title', '%BOXY IN DEEP CHARCOAL%');

    if (userGensError) {
      console.error('Error searching user_generations:', userGensError);
    } else if (userGens && userGens.length > 0) {
      console.log('\n\nFound in user_generations:');
      userGens.forEach((item: any, index: number) => {
        console.log(`\n[${index + 1}] ID: ${item.id}`);
        console.log(`    Title: ${item.title}`);
        console.log(`    Image ID: ${item.image_id || 'N/A'}`);
        console.log(`    Created: ${item.created_at}`);
      });

      // Delete the items
      console.log('\n\nDeleting items...');
      for (const item of userGens) {
        const { error: deleteError } = await supabase
          .from('user_generations')
          .delete()
          .eq('id', item.id);

        if (deleteError) {
          console.error(`Failed to delete item ${item.id}:`, deleteError);
        } else {
          console.log(`✓ Deleted item ${item.id} (${item.title})`);
        }
      }
    } else {
      console.log('No items found in user_generations');
    }

    console.log('\n✓ Deletion complete');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

findAndDeleteItem();
