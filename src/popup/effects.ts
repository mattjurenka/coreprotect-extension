export const supported_effects: {[schema: string]: string[]} = {
    "ERC20": [
      "transfer(address,uint256)",
      "approve(address,uint256)",
      "transferFrom(address,address,uint256)",
      "increaseAllowance(address,uint256)",
      "decreaseAllowance(address,uint256)",
      "increaseApproval(address,uint256)",
      "decreaseApproval(address,uint256)",
      "mint(address,uint256)",
      "burn(uint256)",
      "burnFrom(address,uint256)",
    ], 
    "ERC721": [],
    "ERC1155": [],
  }
