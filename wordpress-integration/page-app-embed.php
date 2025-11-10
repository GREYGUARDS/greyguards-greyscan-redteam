<?php
/**
 * Template Name: App Embed Page
 * Description: Full-width template for embedding the React app
 */

get_header(); ?>

<main id="main-content" class="site-main">
  <div class="container">
    
    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
      
      <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
        
        <!-- Page Title (Optional) -->
        <?php if (get_the_title()): ?>
        <header class="entry-header">
          <h1 class="entry-title" style="font-size: 2rem; font-weight: 700; text-transform: uppercase; margin-bottom: 2rem; text-align: center;">
            <?php the_title(); ?>
          </h1>
        </header>
        <?php endif; ?>
        
        <!-- Page Content -->
        <div class="entry-content">
          <?php the_content(); ?>
        </div>
        
        <!-- App Embed Container -->
        <div class="app-embed">
          <iframe 
            src="<?php echo esc_url(get_field('app_url')); // Using ACF field, or hardcode your app URL ?>"
            title="Greyguards Intelligence Dashboard"
            loading="lazy"
            allowfullscreen>
          </iframe>
        </div>
        
      </article>
      
    <?php endwhile; endif; ?>
    
  </div>
</main>

<?php get_footer(); ?>
