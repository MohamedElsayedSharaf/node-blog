const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Posts = require("../models/post");
const adminLayout = "../views/layouts/admin";
const bycrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: "Unauthorized" });
    }
};
router.get("/admin", async (req, res) => {
    try {
        const locals = {
            title: "Admin",
        };
        res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

router.post("/admin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bycrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
    }
});
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Dashboard",
        };
        const data = await Posts.find();
        res.render("admin/dashboard", {
            locals,
            layout: adminLayout,
            data,
        });
    } catch (error) {
        console.log(error);
    }
});
router.get("/add-post", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add Post",
        };
        const data = await Posts.find();
        res.render("admin/add-post", {
            locals,
            layout: adminLayout,
            data,
        });
    } catch (error) {
        console.log(error);
    }
});
router.post("/add-post", authMiddleware, async (req, res) => {
    try {
        try {
            const newPost = new Posts({
                title: req.body.title,
                body: req.body.body,
            });
            await Posts.create(newPost);
            res.redirect("/dashboard");
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
});
router.put("/edit-post/:id", authMiddleware, async (req, res) => {
    try {
        await Posts.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        })
        res.redirect(`/edit-post/${req.params.id}`)
    } catch (error) {
        console.log(error);
    }
});
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
    try {
            const locals = {
                title: "Edit Post",
            };
            const data = await Posts.findOne({_id: req.params.id})   
            res.render("admin/edit-post", {
                locals,
                layout: adminLayout,
                data,
            });     
    } catch (error) {
        console.log(error); 
    }
});
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
    try {
        await Posts.deleteOne({_id: req.params.id});
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error)
    }
})
// router.post('/admin', async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         if(req.body.username === 'admin' && req.body.password === 'password') {
//             res.send('You are logged in');
//         } else {
//             res.send('Wrong username or password');
//         }
//         res.redirect('/admin')
//     } catch (error) {
//         console.log(error)
//     }
// })
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bycrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: "User created", user });
        } catch (error) {
            if (error.code === 11000) {
                res.status(409).json({ mesaage: "User already in use" });
            }
        }
        res.status(500).json({ message: "Server error" });
    } catch (error) {
        console.log(error);
    }
});
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect('/')
})
module.exports = router;
