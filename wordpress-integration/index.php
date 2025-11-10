<?php
/**
 * Main template file
 */

get_header(); ?>

<main id="main-content" class="site-main">
  <div class="container" style="padding: 2rem 1rem;">
    
    <?php if (have_posts()) : ?>
      
      <div class="grid grid-2">
        <?php while (have_posts()) : the_post(); ?>
          
          <article id="post-<?php the_ID(); ?>" <?php post_class('card'); ?>>
            
            <?php if (has_post_thumbnail()): ?>
              <div style="margin-bottom: 1rem;">
                <?php the_post_thumbnail('large', array('style' => 'width: 100%; height: auto;')); ?>
              </div>
            <?php endif; ?>
            
            <header class="entry-header">
              <h2 class="card-title">
                <a href="<?php the_permalink(); ?>" style="color: var(--foreground); text-decoration: none;">
                  <?php the_title(); ?>
                </a>
              </h2>
              <p style="color: var(--muted-foreground); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem;">
                <?php echo get_the_date(); ?>
              </p>
            </header>
            
            <div class="card-content">
              <?php the_excerpt(); ?>
              <a href="<?php the_permalink(); ?>" class="btn btn-outline" style="margin-top: 1rem;">
                Read More
              </a>
            </div>
            
          </article>
          
        <?php endwhile; ?>
      </div>
      
      <!-- Pagination -->
      <div style="margin-top: 2rem; text-align: center;">
        <?php
        the_posts_pagination(array(
          'prev_text' => __('&laquo; Previous', 'greyguards'),
          'next_text' => __('Next &raquo;', 'greyguards'),
        ));
        ?>
      </div>
      
    <?php else : ?>
      
      <div class="card">
        <h2 class="card-title">Nothing Found</h2>
        <div class="card-content">
          <p>Sorry, no content found. Try searching for what you need.</p>
        </div>
      </div>
      
    <?php endif; ?>
    
  </div>
</main>

<?php get_footer(); ?>
