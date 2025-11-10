<?php
/**
 * Theme Functions
 */

// Enqueue styles and scripts
function greyguards_enqueue_scripts() {
    wp_enqueue_style('greyguards-style', get_stylesheet_uri(), array(), '1.0.0');
}
add_action('wp_enqueue_scripts', 'greyguards_enqueue_scripts');

// Register navigation menus
function greyguards_register_menus() {
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'greyguards'),
    ));
}
add_action('init', 'greyguards_register_menus');

// Theme support
function greyguards_theme_support() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
}
add_action('after_setup_theme', 'greyguards_theme_support');

// Add custom shortcode for app embed
function greyguards_app_embed($atts) {
    $atts = shortcode_atts(array(
        'url' => '',
        'height' => '800px',
    ), $atts);
    
    if (empty($atts['url'])) {
        return '<p>Please provide an app URL.</p>';
    }
    
    return '<div class="app-embed" style="min-height: ' . esc_attr($atts['height']) . ';">
        <iframe 
            src="' . esc_url($atts['url']) . '" 
            title="Greyguards Intelligence Dashboard"
            style="min-height: ' . esc_attr($atts['height']) . ';"
            loading="lazy"
            allowfullscreen>
        </iframe>
    </div>';
}
add_shortcode('greyguards_app', 'greyguards_app_embed');

// Register widget areas
function greyguards_widgets_init() {
    register_sidebar(array(
        'name'          => __('Sidebar', 'greyguards'),
        'id'            => 'sidebar-1',
        'description'   => __('Add widgets here.', 'greyguards'),
        'before_widget' => '<section id="%1$s" class="widget card %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="card-title">',
        'after_title'   => '</h2>',
    ));
}
add_action('widgets_init', 'greyguards_widgets_init');

// Custom post type for case studies (optional)
function greyguards_custom_post_types() {
    register_post_type('case_study', array(
        'labels' => array(
            'name' => __('Case Studies'),
            'singular_name' => __('Case Study')
        ),
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-analytics',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'rewrite' => array('slug' => 'case-studies'),
    ));
}
add_action('init', 'greyguards_custom_post_types');
