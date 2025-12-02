<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); bloginfo('name'); ?></title>
    <meta name="description" content="<?php bloginfo('description'); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
  <div class="header-container">
    <div class="header-logo">
      <img src="<?php echo get_template_directory_uri(); ?>/assets/greyguards-logo.png" alt="Greyguards Intelligence" class="site-logo">
    </div>
    <div class="header-content">
      <h1><?php bloginfo('name'); ?></h1>
      <p><?php bloginfo('description'); ?></p>
    </div>
  </div>
</header>

<?php if (has_nav_menu('primary')): ?>
<nav class="main-nav">
  <?php
  wp_nav_menu(array(
    'theme_location' => 'primary',
    'container' => false,
    'menu_class' => 'nav-menu',
  ));
  ?>
</nav>
<?php endif; ?>
