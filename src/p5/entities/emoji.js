import Config from '../config.js'
import Effect from './effect.js'
import Global from '../../global.js'
import gsap from 'gsap'

export default class Emoji {
  constructor(p, emoji, name, i, j) {
    this.p = p
    this.emoji = emoji
    this.name = name
    this.i = i
    this.j = j
    this.alpha = 0
    this.scale = 1
    this.div = p.createDiv()
    this.effect = null
    this.isSelected = false
    this.selectionIndex

    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundMouseOut = this.onMouseOut.bind(this)
    this.boundClick = this.onClick.bind(this)

    this.calculateDimensions()
    this.addListeners()
  }

  calculateDimensions() {
    const p = this.p

    this.w = (p.width - 2 * Config.padding) / 10
    this.h = (p.height - 2 * Config.padding) / 10
    this.position = p.createVector(Config.padding + this.i * this.w + this.w / 2, Config.padding + this.j * this.h + this.h / 2)
    this.center = this.position.copy()
    this.size = p.min(this.w, this.h)
    p.textSize(this.size)

    this.div.position(this.position.x - this.w / 2, this.position.y - this.h / 2)
    this.div.elt.style.width = this.w + 'px'
    this.div.elt.style.height = this.h + 'px'
    this.div.elt.style.backgroundColor = 'transparent'
    this.div.elt.style.cursor = 'pointer'
  }

  onMouseMove() {
    const p = this.p
    gsap.to(this, { scale: Config.hoverScale, alpha: 255, duration: 0.2, ease: 'power1.out' })
    gsap.to(this.position, { x: p.mouseX, y: p.mouseY, duration: 0.2, ease: 'power1.out' })
  }

  onMouseOut() {
    gsap.to(this, { scale: 0.5, alpha: 0, duration: 0.2, ease: 'power1.out' })
    gsap.to(this.position, { x: this.center.x, y: this.center.y, duration: 0.2, ease: 'power1.out' })
  }

  onClick() {
    this.selectionIndex = Global.numClicks
    Global.numClicks++
    Global.selectedItems.push(this)
    gsap.to(this, { scale: Config.selectedScale, duration: 0.8, ease: 'elastic' })
    this.effect = new Effect(this.p, this.position, this.size)
    this.isSelected = true

    if (Global.numClicks === 3) {
      if (typeof window) {
        window.dispatchEvent(new CustomEvent('deactivate-emojis'))
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('all-emojis-selected', { detail: Global.selectedItems }))
        }, 800)
      }
    }

    this.removeListeners()
  }

  startAnimation() {
    const p = this.p

    this.removeListeners()

    let targetPosition
    if (this.selectionIndex == 0) {
      targetPosition = p.createVector(p.width / 2 - this.size * 3, p.height / 2)
    }

    if (this.selectionIndex == 1) {
      targetPosition = p.createVector(p.width / 2, p.height / 2)
    }

    if (this.selectionIndex == 2) {
      targetPosition = p.createVector(p.width / 2 + this.size * 3, p.height / 2)
    }

    gsap.to(this.position, { x: targetPosition.x, y: targetPosition.y, duration: 2, ease: 'elastic' }).then(() => {
      gsap.to(this.position, { y: -500 * (2 - this.selectionIndex + 1), duration: 1, ease: 'back.in' })
    })
  }

  addListeners() {
    this.div.elt.addEventListener('mousemove', this.boundMouseMove)
    this.div.elt.addEventListener('mouseout', this.boundMouseOut)
    this.div.elt.addEventListener('click', this.boundClick)
  }

  removeListeners() {
    this.div.elt.removeEventListener('mousemove', this.boundMouseMove)
    this.div.elt.removeEventListener('mouseout', this.boundMouseOut)
    this.div.elt.removeEventListener('click', this.boundClick)
  }

  isInsideArea(position) {
    return (
      position.x >= this.center.x - this.w / 2 && position.x < this.center.x + this.w / 2 && position.y >= this.center.y - this.h / 2 && position.y < this.center.y + this.h / 2
    )
  }

  draw() {
    const p = this.p
    if (this.effect) this.effect.draw()

    p.push()
    p.translate(this.position.x, this.position.y)
    p.scale(this.scale)
    p.fill(255, this.alpha)
    p.text(this.emoji, 0, 0)
    p.pop()
  }
}
