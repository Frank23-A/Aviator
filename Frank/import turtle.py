import turtle

t = turtle.Turtle()
t.speed(0)

turtle.bgcolor("black")
t.pensize(2)

colours = ["red", "yellow", "green", "blue", "purple"]

for i in range(360):
    t.color(colours[i % 5])
    t.forward(i * 2)
    t.left(59)
    t.width(i * 1.5)
    t.forward(i / 100 + 1)

turtle.done()

import turtle
import random

t = turtle.Turtle()
t.shape("turtle")
t.pensize(3)
t.speed(0)

turtle.bgcolor("black")
t.penup()
t.goto(0, 0)
t.pendown()

colol = ["#" + ''.join([random.choice('0123456789ABCDEF') for j in range(6)]) for i in range(10)]

for color in colol:
    t.color(color)
    for i in range(2):
        t.forward(100)
        t.left(60)
        t.forward(100)
        t.right(120)
    t.right(7)
    
t.hideturtle()
turtle.done()   