/**
 * aUX.webui - A User Interface library for creating
 * 
 * @copyright 2011 - AppMobi
 * @author IDM
 */

if (!window.aUX)
	aUX = {};
aUX.domFired=false;
var isAppmobi=(window.AppMobi&&typeof(AppMobi)=="objcet")?true:false;
document.addEventListener("DOMContentLoaded",function(){aUX.domFired=true;},false);
aUX.ui = (function() {

	var toolbar = "";
	var content = "";
	var navbar = "";
	var backButton = "";
	var titleBar = "";
	var remotePages = {};
	var history = [];
	var homeDiv = "";
	var screenWidth = "";
	var css3animate = aUX.web.css3Animate;
	var passwordBox = new aUX.web.appMobiPassword();
	var selectBox = new aUX.web.appMobiSelect();
	var ajaxUrl = "";
	var transitionType = "slide";
	var scrollingDivs = [];
	var firstDiv = "";
	var ui = function() {
		// Init the page
		if(!aUX.domFired)
		{
		   var that=this;
		   
		   document.addEventListener("DOMContentLoaded",function(){that.hasLaunched=true;that.launch();},false);
		   return;
		}
		this.hasLaunched=true;
		this.launch();
		
	};

	
	ui.prototype = {
		hasSplash:false,
		setSplashScreen:function(url){
			this.hasSplash=true;
			var div=document.createElement("div");
			div.id="aUX_splashcreen";
			div.style.cssText="width:100%;height:100%;top:0;left;0;position:absolute;z-index:99999;margin:auto;";
			div.innerHTML="<img src='"+url+"'>";
			document.documentElement.appendChild(div);
		},
		hideSplash:function(){
			if(this.hasSplash)
			{
				for(var i=0;i<document.documentElement.childNodes.length;i++)
				{
				   var el=document.documentElement.childNodes[i];
				   if(el.id=="aUX_splashcreen")
				   {
				      el.parentNode.removeChild(el);
					  break;
					}
				}
			}   
		},
		hasLaunched:false,
		activeDiv:"",
		backButtonText:"",
		launch:function(){
			if(this.hasLaunched==false)
			{
				this.hasLaunched=true;
				return;
			}
			var that = this;
			toolbar = $am("toolbar");
			content = $am("content");
			navbar = $am("navbar");
			if (!toolbar) {
				var toolbar = document.createElement("div");
				toolbar.id = "toolbar";
				toolbar.style.cssText = "display:none";
			}
			if (!navbar) {
				navbar = document.createElement("div");
				navbar.id = "navbar";
				document.body.appendChild(navbar);
			}
			if (!content) {
				content = document.createElement("div");
				content.id = "content";
				document.body.appendChild(content);
			}
			navbar.innerHTML = '<a id="backButton"  href="javascript:;"><div>Back</div></a> <h1 id="pageTitle"></h1>'+ navbar.innerHTML;
			backButton = $am("backButton");
			backButton.className="button";
			
			backButton.onclick = function() {		
				if (history.length > 0) {
					var tmpEl = history.pop();
					that.loadContent(tmpEl.target + "", 0, 1, tmpEl.transition);
					transitionType = tmpEl.transition;
				}
			
			};
			backButton.style.visibility = "hidden";
			titleBar = $am("pageTitle");
			this.addContentDiv("AMUi_ajax", "");
			var maskDiv = document.createElement("div");
			maskDiv.id = "AMUI_mask";
			maskDiv.className = "ui-loader ui-body-a ui-corner-all loading-mask";
			maskDiv.innerHTML = "<span class='ui-icon ui-icon-loading spin'></span><h1>Loading Content</h1>";
			maskDiv.zIndex = 20000;
			maskDiv.style.display = "none";
			document.body.appendChild(maskDiv);
			document.addEventListener("appMobi.device.orientation.change",that.updateOrientation, false);
			var modalDiv=document.createElement("div");
			modalDiv.id="AMUI_modal";
			modalDiv.className="modal";
			document.body.appendChild(modalDiv);
			this.updateAnchors(toolbar, 1);
			//this.updateAnchors(navbar);

			var contentDivs=document.querySelectorAll(".panel");
			for(var i=0;i<contentDivs.length;i++){
				var el = contentDivs[i];
				var tmp = el;
				if(tmp.getAttribute("selected"))
					firstDiv=tmp;
				if (el.parentNode && el.parentNode.id != "content") {
					el.parentNode.removeChild(el);
					this.addDivAndScroll(tmp);
				}
			}
			if (firstDiv) {
				
				// Fix a bug in iOS where translate3d makes the content blurry
				this.activeDiv=firstDiv;
				window.setTimeout(function() {
					//activeDiv = firstDiv;
					css3animate(firstDiv, {
						x : "100%",
						time : "0ms"
					});
					if (that.activeDiv.title)
						titleBar.innerHTML = that.activeDiv.title;
					that.hideSplash();
				}, 100);
				
			}
		},
		clearHistory:function(){
			this.history=[];
		},
		updateContentDiv : function(id, content) {
			var el = $am(id);
			if (!el)
				return;
			el.childNodes[0].innerHTML = content;
			this.updateAnchors(el);
		},
		addContentDiv : function(el, content) {
			var myEl = document.getElementById(el);
			if (!myEl) {
				var newDiv = document.createElement("div");
				newDiv.id = el;
				newDiv.innerHTML = content;
			} else {
				newDiv = myEl;
			}
			newDiv.className = "panel";
			this.addDivAndScroll(newDiv);
		},
		addDivAndScroll : function(tmp) {
		
			content.appendChild(tmp);
			var addScroller=true;
			if(tmp.getAttribute("scrolling")&&tmp.getAttribute("scrolling").toLowerCase()=="no")
			   addScroller=false;
			var myDiv = document.createElement("div");

			myDiv.innerHTML = tmp.innerHTML;
			myDiv.innerHTML += "<Br>"; // this helps with the bottom margin
			tmp.innerHTML = "";
			tmp.appendChild(myDiv);
			this.updateAnchors(myDiv);
			selectBox.getOldSelects(tmp.id);
			passwordBox.getOldPasswords(tmp.id);
			if(addScroller){
				scrollingDivs[tmp.id]=(aUX.web.scroller(myDiv, {
					scrollBars : true,
					verticalScroll : true,
					horizontalScroll : false,
					vScrollCSS : "scrollBarV"
				}));
			}
		},
		updateAnchors : function(domEl, reset) {
			var anchors = domEl.getElementsByTagName("a");
			var that = this;
			var theTransition;
			for ( var i = 0; i < anchors.length; i++) {
				if (anchors[i].href.indexOf("javascript:") != -1)
					continue;
				anchors[i].oldhref = anchors[i].href;
				anchors[i].oldhash = anchors[i].hash;
				anchors[i].href = "javascript:;";
				anchors[i].oldonclick = anchors[i].onclick;
				anchors[i].resetHistory = reset;
				anchors[i].onclick = function() {
					var transition = "slide";
					if (this.target && this.target != "") {

						if (AppMobi.device && AppMobi.device.showRemoteSite)
							AppMobi.device.showRemoteSite(this.oldhref);
						else {
							window.open(this.oldhref);
						}
						return;
					}
					var mytransition = this.getAttribute("data-transition");
					var dataParams=this.getAttribute("data-params");
					//Conver the data params to a json object
					if(dataParams)
					{
					   try{
					      var tmp=dataParams.split(",");
						  dataParams={};
						  for(var i=0;i<tmp.length;i++)
						  {
						     var data=tmp[i].split(":");
							 dataParams[data[0]]=data[1];
						  }
						}
						catch(e){console.log(e);dataParams={};}
					}
					else
						dataParams={};
					var dataFunction=this.getAttribute("data-function");
					switch (mytransition) {
					case "up":
						transition = "up";
						break;
					case "down":
						transition = "down";
						break;
					case "flip":
						transition = "flip";
						break;
					case "fade":
						transition = "fade";
						break;
					case "pop":
						transition = "pop";
						break;
					default:
						transition = "slide";
					}
					that.loadContent(
							this.oldhash ? this.oldhash : this.oldhref,
							this.resetHistory, 0, transition,{dataParams:dataParams,dataFunction:dataFunction});
					if (this.oldonclick)
						this.oldonclick();
				};
			}

		},
		updateOrientation : function(event) {
			for ( var i = 0; i < scrollingDivs.length; i++) {
				scrollingDivs[i].scrollTo({
					x : 0,
					y : 0
				});
			}
			css3animate(this.activeDiv, {
				x : "100%",
				time : "0ms"
			});
		},
		showModal:function(id){
			var that=this;
			try{
				if($am(id)){
					var modal=$am("AMUI_modal");
					modal.innerHTML="";
					var button=document.createElement("div");
					button.style.float="right";
					button.onclick=function(){that.hideModal();}
					button.innerHTML="[x]";
					var content=document.createElement("div");
					content.innerHTML=$am(id).innerHTML;
					modal.appendChild(button);
					modal.appendChild(content);
					modal.style.display="block";
				}
			}
			catch(e){console.log ("Error with modal - "+e);}
		},
		hideModal:function(){
			$am("AMUI_modal").innerHTML="";
			$am("AMUI_modal").style.display="none";
		},
		loadContent : function(target, newTab, back, transition,dataObj) {
			
			try {
				what = null;
				var that = this;
				that.hideMask();
				if (target.indexOf("#") == -1) {
					// XML Request
					if (this.activeDiv.id == "AMUi_ajax" && target == ajaxUrl)
						return;
					if (target.indexOf("http") == -1)
						target = AppMobi.webRoot + target;
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange = function() {
						if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
							that.updateContentDiv("AMUi_ajax",xmlhttp.responseText);
							$am("AMUi_ajax").title = target;
							that.loadContent("#AMUi_ajax", newTab, back);
							return;
						}
					};
					ajaxUrl = target;
					xmlhttp.open("GET", target, true);
					xmlhttp.send();
					// show Ajax Mask
					this.showMask();
				} 
				else {
					
					// load a div
					what = target.replace("#", "");
					what = $am(what);
					if(!what)
					    throw ("Target: "+target+" was not found");
					if (what == this.activeDiv && !back)
						return;

					if(what.getAttribute("modal"))
					{
					   return this.showModal(what.id);
					}
					what.style.display = "block";
					//fix scroller
					if(scrollingDivs[what.id])
					{
						scrollingDivs[what.id].scrollTo({x : 0,y : 0});
					}
					var oldHistory = [];
					if (newTab) {
						
						history = [];
						history.push({
							target : "#" + firstDiv.id,
							transition : "slide"
						});
						//Let's reposition the other elements
						var divs=document.getElementById("content").querySelectorAll(".panel");
						for(var kk=0;kk<divs.length;kk++)
						{
							if(divs[kk].id!=this.activeDiv.id)
							{
								css3animate(oldDiv, {x : 0,	y : 0,time : "1ms"});
							}
						}
						
					} else if (!back) {
						history.push({
							target : "#" + this.activeDiv.id,
							transition : transition
						});

					}
					transitionType = transition;
					var oldDiv = this.activeDiv;
					var currWhat = what;

					switch (transition) {
					case "up":
						this.slideUpTransition(oldDiv, currWhat, back);
						break;
					case "down":
						this.slideDownTransition(oldDiv, currWhat, back);
						break;
					case "fade":
						this.fadeTransition(oldDiv, currWhat, back);
						break;
					case "flip":
						this.flipTransition(oldDiv, currWhat, back);
						break;
					case "pop":
						this.popTransition(oldDiv, currWhat, back);
						break;
					default:
						this.slideTransition(oldDiv, currWhat, back);
					}

					if (back) {
						if (history.length > 0) {
							var val = history[history.length - 1];
							var el = $am(val.target.replace("#", ""));
							this.setBackButtonText(el.title)
						}
					} else if (this.activeDiv.title)
						this.setBackButtonText(this.activeDiv.title)
					else
						this.setBackButtonText("Back");
					if (what.title) {
						titleBar.innerHTML = what.title;
					}
					if (newTab) {
						this.setBackButtonText(firstDiv.title)
					}

					if (history.length == 0) {
						backButton.style.visibility = "hidden";
						history = [];
					} else
						backButton.style.visibility = "visible";
					this.activeDiv = what;
					
					//Let's check if it has a function to run to update the data
					
					
					if(dataObj&&dataObj.dataFunction&&window[dataObj.dataFunction])
					{
					   window[dataObj.dataFunction](what,dataObj.dataParams);
					}
				}
			} catch (e) {
				console.log("Error with loading content " + e + "  - "
								+ target);
			}
		},
		setBackButtonText:function(text){
			if(this.backButtonText.length>0)
			   backButton.innerHTML="<div>"+this.backButtonText+"</div>";
			else
				backButton.innerHTML="<div>"+text+"</div>";
		},
		showMask : function() {
			$am("AMUI_mask").style.display = "block";
		},
		hideMask : function() {
			$am("AMUI_mask").style.display = "none";
		},
		slideTransition : function(oldDiv, currDiv, back) {
			if (back) {
				css3animate(oldDiv, {
					x : "200%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							time : "1ms"
						});
					}
				});
				css3animate(currDiv, {
					x : "100%",
					time : "200ms"
				});
			} else {
				css3animate(oldDiv, {
					x : "0%",
					time : "200ms"
				});
				css3animate(currDiv, {
					x : "200%",
					time : "1ms",
					callback : function() {
						css3animate(currDiv, {
							x : "100%",
							time : "200ms"
						});
					}
				});
			}
		},
		slideUpTransition : function(oldDiv, currDiv, back) {

			if (back) {
				css3animate(currDiv, {
					x : "100%",
					y : "0%",
					time : "1ms"
				});
				css3animate(oldDiv, {
					y : "100%",
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
						currDiv.style.zIndex = 2;
						oldDiv.style.zIndex = 1;
					}
				});
			} else {
				oldDiv.style.zIndex = 1;
				currDiv.style.zIndex = 2;
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
					}
				});
				css3animate(currDiv, {
					y : "100%",
					x : "100%",
					time : "1ms",
					callback : function() {
						css3animate(currDiv, {
							y : "0%",
							x : "100%",
							time : "200ms"
						});
					}
				});
			}
		},
		slideDownTransition : function(oldDiv, currDiv, back) {

			if (back) {
				css3animate(currDiv, {
					x : "100%",
					y : "0%",
					time : "1ms"
				});
				css3animate(oldDiv, {
					y : "-100%",
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
						currDiv.style.zIndex = 2;
						oldDiv.style.zIndex = 1;
					}
				});
			} else {
				oldDiv.style.zIndex = 1;
				currDiv.style.zIndex = 2;
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
					}
				});
				css3animate(currDiv, {
					y : "-100%",
					x : "100%",
					time : "1ms",
					callback : function() {
						css3animate(currDiv, {
							y : "0%",
							x : "100%",
							time : "200ms"
						});
					}
				});
			}
		},
		flipTransition : function(oldDiv, currDiv, back) {
			if (back) {
				css3animate(currDiv, {
					x : "200%",
					time : "1ms",
					scale : .8,
					rotateY : "180deg",
					callback : function() {
						css3animate(currDiv, {
							x : "100%",
							time : "200ms"
						});
					}
				});
				css3animate(oldDiv, {
					x : "200%",
					time : "200ms",
					scale : .8,
					rotateY : "180deg",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							time : "1ms",
							opacity : 1
						});
						currDiv.style.zIndex = 2;
						oldDiv.style.zIndex = 1;
					}
				});
			} else {
				oldDiv.style.zIndex = 1;
				currDiv.style.zIndex = 2;
				css3animate(oldDiv, {
					x : "200%",
					time : "200ms",
					scale : '.8',
					rotateY : "180deg",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
					}
				});
				css3animate(currDiv, {
					x : "200%",
					time : "1ms",
					scale : .8,
					rotateY : "180deg",
					callback : function() {
						css3animate(currDiv, {
							x : "100%",
							time : "200ms"
						});
					}
				});
			}
		},
		fadeTransition : function(oldDiv, currDiv, back) {
			if (back) {
				css3animate(currDiv, {
					x : "100%",
					time : "1ms"
				});
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					opacity : .1,
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							time : "1ms",
							opacity : 1
						});
						currDiv.style.zIndex = 2;
						oldDiv.style.zIndex = 1;
					}
				});
			} else {
				oldDiv.style.zIndex = 1;
				currDiv.style.zIndex = 2;
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
					}
				});
				currDiv.style.opacity = 0;
				css3animate(currDiv, {
					x : "100%",
					time : "1ms",
					callback : function() {
						css3animate(currDiv, {
							x : "100%",
							time : "200ms",
							opacity : 1
						});
					}
				});
			}
		},
		popTransition : function(oldDiv, currDiv, back) {

			if (back) {
				css3animate(currDiv, {
					x : "100%",
					time : "1ms"
				});
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					opacity : .1,
					scale : .2,
					origin : "50% 50%",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							time : "1ms"
						});
						currDiv.style.zIndex = 2;
						oldDiv.style.zIndex = 1;
					}
				});
			} else {
				oldDiv.style.zIndex = 1;
				currDiv.style.zIndex = 2;
				css3animate(oldDiv, {
					x : "100%",
					time : "200ms",
					callback : function() {
						css3animate(oldDiv, {
							x : 0,
							y : 0,
							time : "1ms"
						});
					}
				});
				css3animate(currDiv, {
					x : "100%",
					y : "0%",
					time : "1ms",
					scale : .2,
					origin : "50% 50%",
					opacity : .1,
					callback : function() {
						css3animate(currDiv, {
							x : "100%",
							time : "200ms",
							scale : 1,
							opacity : 1,
							origin : "0% 0%"
						});
					}
				});
			}
		}
	};

	function $am(el) {
		return document.getElementById(el);
	}
	return ui;
})();