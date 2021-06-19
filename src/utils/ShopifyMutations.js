const { persFeeEditMessage } = require('../config/config');

module.exports = {
  beginEdit(gid) {
    return `
    mutation beginEdit{
      orderEditBegin(id: "${gid}"){
        calculatedOrder {
          id
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }`;
  },
  addCustomItemToOrder(gid, title, price, quantity = 1) {
    return `
      mutation addCustomItemToOrder {
        orderEditAddCustomItem( id: "${gid}", title: "${title}", quantity: 1, price: { amount: ${
      price * quantity
    }, currencyCode: USD }) 
        {
          calculatedOrder {
            id
            addedLineItems(first: 5) {
              edges {
                node {
                  id
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
  },
  changeLineItemQuantity(gid, lineItemGqlId, quantity) {
    return `
        mutation increaseLineItemQuantity {
        orderEditSetQuantity(id: "${gid}", lineItemId: "${lineItemGqlId}", quantity: ${quantity}) {
            calculatedOrder {
            id
            addedLineItems(first: 5) {
                edges {
                node {
                    id
                    quantity
                }
                }
            }
            }
            userErrors {
            field
            message
            }
        }
        }`;
  },
  commitEdit(gid) {
    return `
      mutation commitEdit {
        orderEditCommit(id: "${gid}", notifyCustomer: false, staffNote: "${persFeeEditMessage}") {
          order {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`;
  },
};
