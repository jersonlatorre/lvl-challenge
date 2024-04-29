import Emoji from './emoji'
import emojisList from '../../data/emojis-list'

export default class Interaction {
  constructor(p) {
    this.p = p
    this.emojis = []

    p.textAlign(p.CENTER, p.CENTER)

    // emojisList.sort(() => Math.random() - 0.5)
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const emoji = emojisList[i * 10 + j]
        this.emojis.push(new Emoji(p, emoji.emoji, emoji.name, i, j))
      }
    }

    window.addEventListener('deactivate-emojis', () => {
      this.emojis.forEach((emoji) => {
        emoji.div.remove()
      })
    })

    window.addEventListener('all-emojis-selected', () => {
      this.emojis.forEach((emoji) => {
        emoji.div.remove()
      })

      this.emojis = this.emojis.filter((emoji) => emoji.isSelected)
      this.emojis.forEach((emoji) => {
        emoji.startAnimation()
      })

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('selection-finished'))
      }, 3000)
    })
  }

  draw() {
    const p = this.p
    p.background('white')
    this.emojis.forEach((emoji) => {
      emoji.draw()
    })
  }

  windowResized() {
    this.emojis.forEach((emoji) => {
      emoji.calculateDimensions()
    })
  }
}
