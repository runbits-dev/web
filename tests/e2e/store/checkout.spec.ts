import { test, expect } from '../../fixtures/base'

const API = 'https://api.runbits.dev'

test.describe('Store Checkout', () => {
  // The /store route on runbits-web is now a redirect shim that pushes the user
  // to https://runbits.app/store (a separate deployment). End-to-end tests for
  // the storefront live in that repo. We keep the file as a skip with a TODO so
  // the suite is greppable.
  test.skip('shows store with menu items — moved to runbits.app', async () => {})
  test.skip('can add items to cart — moved to runbits.app', async () => {})
  test.skip('shows checkout modal — moved to runbits.app', async () => {})
})
