---
title: "2D Raycasting in Rust with Nannou"
layout: blog-post
date: "2022-04-22"
category:
tags:
- Rust
---

[Nannou Raycast](https://github.com/edap/nannou_raycast) is a small library I wrote to test 2D ray intersections in [nannou](https://github.com/nannou-org/nannou), a creative coding framework for Rust. It casts rays against segments, circles and AABBs, and computes reflection, refraction and the Fresnel coefficient for each hit.

## The ray

A `Ray2d` is just an origin and a normalized direction:

```rust
pub struct Ray2d {
    pub orig: Vec2,
    pub dir: Vec2,
}
```

It can be aimed with `look_at`, given an angle with `set_dir_from_angle`, or pointed straight at the mouse, which is how the example below moves it around.

## Intersecting a circle

`intersect_circle` solves the classic ray-sphere equation and, if there is a hit, returns both the distance to the collision and the surface normal at that point:

```rust
pub fn intersect_circle(&self, center: &Vec2, radius: &f32) -> Option<(f32, Vec2)> {
    let l = *center - self.orig;
    let adj = l.dot(self.dir);
    let d2 = l.dot(l) - (adj * adj);
    if d2 > radius * radius {
        return None;
    }
    // ...distance and normal follow from here
}
```

The same normal is then fed to `reflect` and `refract`, which mirror the formulas used in raytracers: `reflect` follows the standard `I - 2*dot(N,I)*N`, while `refract` and `fresnel` are the 2D equivalent of the ones described on [Scratchapixel](https://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/reflection-refraction-fresnel).

## Trying it out

The `circle` example casts 60 rays from the mouse position and draws, for each one that hits the circle, the incoming ray in white, the refraction in violet and the reflection in blue:

```rust
if let Some((dist, normal)) = ray.intersect_circle(&circle_pos, &circle_radius) {
    let hit = ray.orig + ray.dir * dist;
    let refraction = ray.refract(normal, IOR_GLASS);
    let reflection = ray.reflect(normal);
    // draw hit, refraction and reflection as arrows
}
```

Running `cargo run --example circle` gives this result, with the rays bending as they pass through the circle as if it were made of glass:

![nannou raycast example](/img/posts/nannou-raycast/example.png)
