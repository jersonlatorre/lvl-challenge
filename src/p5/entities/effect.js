import Config from '../config'

export default class Effect {
  constructor(p, position, size) {
    this.p = p
    this.position = position.copy()
    this.size = size
    this.radius = 0
    this.particles = Array.from({ length: 50 }, () => new Particle(p, this.position))
    this.isDead = false
  }

  draw() {
    this.particles = this.particles.filter((particle) => !particle.isDead)
    this.particles.forEach((particle) => particle.draw())
    const allDead = this.particles.every((particle) => particle.isDead)

    if (allDead) {
      this.isDead = true
    }
  }
}

class Particle {
  constructor(p, position) {
    this.p = p
    this.position = position.copy()
    this.velocity = this.random2D().mult(p.random(5, 15))
    this.alpha = 255
    this.isDead = false
  }

  draw() {
    const p = this.p

    this.position.add(this.velocity)
    this.velocity.mult(0.9)
    this.alpha *= 0.9

    if (this.alpha <= 0.05) {
      this.isDead = true
    }

    p.push()
    p.noStroke()
    p.rectMode(p.CENTER)
    p.fill(...Config.effectColor, this.alpha)
    p.square(this.position.x, this.position.y, 10)
    p.pop()
  }

  random2D() {
    const p = this.p
    return p.createVector(p.random(-1, 1), p.random(-1, 1)).normalize()
  }
}
