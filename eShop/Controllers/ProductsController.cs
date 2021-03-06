﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using eShop.Models;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

namespace eShop.Controllers
{
    public class ProductsController : Controller
    {
        private eShopTestContext _context;
        

        public ProductsController(eShopTestContext context)
        {
            _context = context;
            
        }
        public IActionResult Index(int? Sku)
        {
            if (!Sku.HasValue)
            {
                var prodcuts = _context.Products;
                return View(_context.Products.Include(x => x.Reviews));
            }
            else
            {
                return View(_context.Products.Include(x => x.Reviews).Where(x => x.Id == Sku.Value));
            }
           

        }

        [HttpPost]
        public IActionResult Index(int? Sku, bool extra)
        {


            // TO CREATE COOKIE FOR THE ORDER
            string cartId;
            Guid cartGuid;
            Cart cart = null; ;
            if(Request.Cookies.TryGetValue("cartId", out cartId) && Guid.TryParse(cartId, out cartGuid) && _context.Cart.Any(x => x.UserId == cartId))
            {
                cart = _context.Cart.Include(x => x.Product).Include(p => p.User).Single(x => x.CartId == cartGuid);
            }
            else
            {
                cart = new Cart();
                cart.CartId = Guid.NewGuid();
                _context.Cart.Add(cart);
                Response.Cookies.Append("cartId", cart.CartId.ToString());
            }
            cart.Product = _context.Products.First(x => x.Sku == Sku);
            _context.SaveChanges();




            return RedirectToAction("Index", "Cart");
        }


       


    }
}