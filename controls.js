function AwmUI(AwmVideo, structure) {
  AwmVideo.UI = this;
  this.elements = [];

  this.buildStructure = function (structure) {
    if (typeof structure == "function") {
      structure = structure.call(AwmVideo);
    }

    if ("if" in structure) {
      var result = false;
      if (structure.if.call(AwmVideo, structure)) {
        result = structure.then;
      } else if ("else" in structure) {
        result = structure.else;
      }

      if (!result) {
        return;
      }

      //append the result with structure options
      for (var i in structure) {
        if (["if", "then", "else"].indexOf(i) < 0) {
          if (i in result) {
            if (!(result[i] instanceof Array)) {
              result[i] = [result[i]];
            }
            result[i] = result[i].concat(structure[i]);
          } else {
            result[i] = structure[i];
          }
        }
      }
      return this.buildStructure(result);
    }

    if ("type" in structure) {
      if (structure.type in AwmVideo.skin.blueprints) {

        //create the element; making sure to pass "this" to blueprint function
        var container = AwmVideo.skin.blueprints[structure.type].call(AwmVideo, structure);
        if (!container) {
          return;
        }
        AwmUtil.class.add(container, "awmvideo-" + structure.type);

        if ("css" in structure) {
          var uid = AwmUtil.createUnique();
          structure.css = [].concat(structure.css); //convert to array; should be in string format with colors already applied

          for (var i in structure.css) {
            var style = AwmUtil.css.createStyle(structure.css[i], uid);
            container.appendChild(style);
          }
          AwmUtil.class.add(container, uid);
          container.uid = uid;
        }

        if ("classes" in structure) {
          for (var i in structure.classes) {
            AwmUtil.class.add(container, structure.classes[i]);
          }
        }

        if ("title" in structure) {
          container.title = structure.title;
        }

        if ("style" in structure) {
          for (var i in structure.style) {
            container.style[i] = structure.style[i];
          }
        }

        if ("children" in structure) {
          for (var i in structure.children) {
            var child = this.buildStructure(structure.children[i]);
            if (child) {
              container.appendChild(child);
            }
          }
        }
        //save the returned element so they can be killed on unload
        AwmVideo.UI.elements.push(container);
        return container;
      }
    }

    return false;
  };
  this.build = function () {
    return this.buildStructure(structure ? structure : AwmVideo.skin.structure.main);
  };

  var container = this.build();

  //apply skin CSS
  var uid = AwmUtil.createUnique();
  var loaded = 0;
  if (AwmVideo.skin.css.length) {
    container.style.opacity = 0;
  }
  for (var i in AwmVideo.skin.css) {
    var style = AwmVideo.skin.css[i];
    style.callback = function (css) {
      if (css == "/*Failed to load*/") {
        this.textContent = css;
        AwmVideo.showError("Failed to load CSS from " + this.getAttribute("data-source"));
      } else {
        this.textContent = AwmUtil.css.prependClass(css, uid, true);
      }
      loaded++;
      if (AwmVideo.skin.css.length <= loaded) {
        container.style.opacity = "";
      }
    };
    if (style.textContent != "") {
      //it has already loaded
      style.callback(style.textContent);
    }
    container.appendChild(style);
  }
  AwmUtil.class.add(container, uid);

  //add browser class
  var browser = AwmUtil.getBrowser();
  if (browser) {
    AwmUtil.class.add(container, "browser-" + browser);
  }

  return container;
}
