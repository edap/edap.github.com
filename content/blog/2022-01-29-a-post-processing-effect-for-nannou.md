---
title: "A Post-Processing Effect for Nannou"
layout: blog-post
date: "2022-01-29"
category:
tags:
- Rust
- WebGPU
---

[screenefect](https://github.com/edap/screenefect) is a small Rust crate that adds a full-screen post-processing pass to a [nannou](https://github.com/nannou-org/nannou) sketch: instead of drawing straight to the window, the scene is rendered to an offscreen texture, then that texture is sampled by a fragment shader and written to the frame. It is adapted from nannou's own `draw_capture_hi_res` example.

## Rendering into a texture

`PostProcessingEffect::new` builds an offscreen `wgpu::Texture`, a `Draw` instance to draw into it, and the render pipeline that will later sample it with the vertex and fragment shaders passed in:

```rust
pub struct PostProcessingEffect {
    pub texture: wgpu::Texture,
    pub draw: nannou::Draw,
    pub renderer: nannou::draw::Renderer,
    bind_group: wgpu::BindGroup,
    render_pipeline: wgpu::RenderPipeline,
    uniform_buffer: wgpu::Buffer,
    vertex_buffer: wgpu::Buffer,
}
```

A single `time` uniform is uploaded every frame through `update_buffer`, so the shader can animate the effect.

## The render pass

`encode_render_pass` draws a full-screen quad textured with the offscreen texture into whatever destination view it is given, which `view` then points at the actual frame:

```rust
pub fn encode_render_pass(
    &self,
    dst_texture: &wgpu::TextureViewHandle,
    encoder: &mut wgpu::CommandEncoder,
) {
    let mut render_pass = wgpu::RenderPassBuilder::new()
        .color_attachment(dst_texture, |color| color)
        .begin(encoder);
    render_pass.set_pipeline(&self.render_pipeline);
    render_pass.set_vertex_buffer(0, self.vertex_buffer.slice(..));
    render_pass.set_bind_group(0, &self.bind_group, &[]);
    render_pass.draw(0..VERTICES.len() as u32, 0..1);
}
```

## Using it in a sketch

In `update`, the sketch draws into `effect.draw` instead of the usual `draw`, then asks the effect to render that into its texture. `view` just forwards the frame to `effect.view`:

```rust
fn update(app: &App, model: &mut Model, _update: Update) {
    let draw = &model.effect.draw;
    draw.reset();
    draw.background().color(BLACK);
    draw.ellipse().x_y(app.time.sin() * 200.0, app.time.cos() * 200.0).color(RED);

    let window = app.main_window();
    model.effect.update_buffer(&window, app.time);
    model.effect.update(&window, &window.device());
}

fn view(_app: &App, model: &Model, frame: Frame) {
    model.effect.view(frame);
}
```

The fragment shader shipped in the repo, `fs_msaa4_noise.wgsl`, warps the texture coordinates with a value-noise vector field and draws a grid on top of it, so swapping in a different `.wgsl` file is enough to get a completely different look.
